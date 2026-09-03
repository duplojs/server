import * as DCommon from "@duplojs/lang/common";
import type * as DKind from "@duplojs/lang/kind";
import * as DArray from "@duplojs/lang/array";
import * as DGenerator from "@duplojs/lang/generator";
import * as DObject from "@duplojs/lang/object";
import { createKind } from "../kind";
import type { Option } from "./options";
import { SymbolCommandError, type Error } from "./error";
import { logCommandHelp, helpOption } from "./help";
import { type Argument } from "./argument";
import { type ForbiddenDuplicateName } from "./types";

const commandKind = createKind("command");

export function isCommands(input: unknown): input is DCommon.AnyTuple<Command> {
	return input instanceof Array
		? input.every(commandKind.has)
		: false;
}

type CommandSubject = {
	readonly type: "subCommand";
	readonly subCommands: readonly Command[];
} | {
	readonly type: "argument";
	readonly args: readonly Argument[];
};

export interface Command<
	GenericName extends string = string,
> extends DKind.Kind<
	typeof commandKind
	> {
	readonly name: GenericName;
	readonly description: string | null;
	readonly subject: CommandSubject | null;
	readonly options: readonly Option[];
	execute(args: readonly string[], error: Error): Promise<undefined | SymbolCommandError>;
}

export type Subjects = (
	| DCommon.AnyTuple<Argument>
	| DCommon.AnyTuple<Command>
);

export type ForbiddenBadOrderArguments<
	GenericSubject extends readonly Subjects[number][],
	GenericContainOptional extends boolean = false,
> = GenericSubject extends readonly [
	Argument<string, infer InferredValue>,
	...infer InferredRest extends Argument[],
]
	? DCommon.And<[
		DCommon.IsEqual<GenericContainOptional, true>,
		DCommon.Not<DCommon.UnionContain<InferredValue, undefined>>,
	]> extends true
		? DCommon.ComputedTypeError<"Optional argument can't be define before required argument">
		: ForbiddenBadOrderArguments<InferredRest, DCommon.UnionContain<InferredValue, undefined>>
	: unknown;

export interface CreateCommandParams<
	GenericOptions extends DCommon.AnyTuple<Option> = DCommon.AnyTuple<Option>,
	GenericSubject extends Subjects = Subjects,
> {
	readonly description?: string;
	readonly options?: (
		& GenericOptions
		& ForbiddenDuplicateName<GenericOptions, "option">
	);
	readonly subjects?: (
		& GenericSubject
		& ForbiddenDuplicateName<GenericSubject, "subject">
		& ForbiddenBadOrderArguments<GenericSubject>
	);
}

export type CreateCommandExecuteParams<
	GenericOptions extends DCommon.AnyTuple<Option>,
	GenericArguments extends DCommon.AnyTuple<Argument>,
> = (
	& (
		DCommon.IsEqual<GenericOptions, never> extends true
			? {}
			: {
				options: {
					[GenericOption in GenericOptions[number] as GenericOption["name"]]: Exclude<
						Awaited<ReturnType<
							GenericOption["execute"]
						>>,
						SymbolCommandError
					>["result"]
				};
			}
	)
	& (
		DCommon.IsEqual<GenericArguments, never> extends true
			? {}
			: {
				args: {
					[GenericArgument in GenericArguments[number] as GenericArgument["name"]]: Exclude<
						Awaited<ReturnType<
							GenericArgument["execute"]
						>>,
						SymbolCommandError
					>
				};
			}
	)
);

export function create<
	GenericName extends string,
>(
	name: GenericName,
	execute: () => void,
): Command<GenericName>;

export function create<
	GenericName extends string,
	const GenericOptions extends DCommon.AnyTuple<Option> = never,
	GenericSubjects extends Subjects = never,
>(
	name: GenericName,
	params: CreateCommandParams<
		GenericOptions,
		GenericSubjects
	>,
	execute: (
		params: CreateCommandExecuteParams<
			GenericOptions,
			Extract<GenericSubjects, DCommon.AnyTuple<Argument>>
		>,
	) => DCommon.MaybePromise<void>,
): Command<GenericName>;

export function create(
	...args: [string, DCommon.AnyFunction] | [
		string,
		CreateCommandParams<
			DCommon.AnyTuple<Option>,
			Subjects
		>,
		DCommon.AnyFunction,
	]
): Command {
	const [name, params, execute] = args.length === 2
		? [args[0], {}, args[1]]
		: args;

	const self: Command = {
		name,
		description: params.description ?? null,
		options: params.options ?? [],
		subject: DCommon.justExec((): CommandSubject | null => {
			if (isCommands(params.subjects)) {
				return {
					type: "subCommand",
					subCommands: params.subjects,
				};
			} else if (params.subjects) {
				return {
					type: "argument",
					args: params.subjects,
				};
			}

			return null;
		}),
		execute: async(args, error) => {
			if (self.subject?.type === "subCommand") {
				for (const command of self.subject.subCommands) {
					if (args[0] === command.name) {
						error.pushPath(command.name);
						return command.execute(DArray.shift(args), error);
					}
				}
			}

			const help = await helpOption.execute(args, error);

			if (help === SymbolCommandError) {
				return SymbolCommandError;
			} else if (help.result) {
				logCommandHelp(self);
				return;
			}

			const commandOptions = await DGenerator.asyncReduce(
				self.options,
				DGenerator.reduceFrom<{
					options: Record<string, unknown>;
					restArgs: readonly string[];
				}>({
					options: {},
					restArgs: args,
				}),
				async({ item: option, lastValue, next, exit }) => {
					const optionResult = await option.execute(lastValue.restArgs, error);

					if (optionResult === SymbolCommandError) {
						return exit(SymbolCommandError);
					}

					return next({
						options: DObject.override(
							lastValue.options,
							{
								[option.name]: optionResult.result,
							},
						),
						restArgs: optionResult.argumentRest,
					});
				},
			);

			if (commandOptions === SymbolCommandError) {
				return SymbolCommandError;
			}

			if (self.subject?.type === "argument") {
				if (self.subject.args.length !== commandOptions.restArgs.length) {
					return error.addTooMuchCommandArgumentIssue(
						self.subject.args.length,
						commandOptions.restArgs.length,
					);
				}

				const commandArguments = await DGenerator.asyncReduce(
					self.subject.args,
					DGenerator.reduceFrom<{
						args: Record<string, unknown>;
						restArgs: readonly string[];
					}>({
						args: {},
						restArgs: commandOptions.restArgs,
					}),
					async({ item: argument, lastValue, next, exit }) => {
						const firstArgument = DArray.first(lastValue.restArgs);

						const argumentResult = await argument.execute(firstArgument, error);

						if (argumentResult === SymbolCommandError) {
							return exit(SymbolCommandError);
						}

						return next({
							args: DObject.override(
								lastValue.args,
								{ [argument.name]: argumentResult },
							),
							restArgs: DArray.shift(lastValue.restArgs),
						});
					},
				);

				if (commandArguments === SymbolCommandError) {
					return SymbolCommandError;
				}

				await execute({
					options: commandOptions.options,
					args: commandArguments.args,
				});
			} else {
				if (commandOptions.restArgs.length > 0) {
					return error.addTooMuchCommandArgumentIssue(
						0,
						commandOptions.restArgs.length,
					);
				}

				await execute({ options: commandOptions.options });
			}

			return;
		},
	} satisfies DKind.Remove<Command> as never;

	return self;
}
