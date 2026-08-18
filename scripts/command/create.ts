import { type Kind, type AnyFunction, type RemoveKind, type MaybePromise, type AnyTuple, justExec, type ComputedTypeError, type IsEqual, type And, type Not, type UnionContain, type NeverCoalescing } from "@duplojs/utils";
import * as AA from "@duplojs/utils/array";
import * as GG from "@duplojs/utils/generator";
import * as OO from "@duplojs/utils/object";
import { createDuplojsServerUtilsKind } from "@scripts/kind";
import { exitProcess } from "@scripts/common/exitProcess";
import type { Option } from "./options";
import { addIssue, SymbolCommandError, type CommandError } from "./error";
import { logCommandHelp, helpOption } from "./help";
import { type Argument } from "./argument";
import { type ForbiddenDuplicateName } from "./types";

const commandKind = createDuplojsServerUtilsKind("command");

export function isCommands(input: unknown): input is AnyTuple<Command> {
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
> extends Kind<
	typeof commandKind.definition
	> {
	readonly name: GenericName;
	readonly description: string | null;
	readonly subject: CommandSubject | null;
	readonly options: readonly Option[];
	execute(args: readonly string[], error: CommandError): Promise<undefined | SymbolCommandError>;
}

export type Subjects = AnyTuple<Argument> | AnyTuple<Command>;

export type ForbiddenBadOrderArguments<
	GenericSubject extends readonly Subjects[number][],
	GenericContainOptional extends boolean = false,
> = GenericSubject extends readonly [
	Argument<string, infer InferredValue>,
	...infer InferredRest extends Argument[],
]
	? And<[
		IsEqual<GenericContainOptional, true>,
		Not<UnionContain<InferredValue, undefined>>,
	]> extends true
		? ComputedTypeError<"Optional argument can't be define before required argument">
		: ForbiddenBadOrderArguments<InferredRest, UnionContain<InferredValue, undefined>>
	: unknown;

export interface CreateCommandParams<
	GenericOptions extends AnyTuple<Option> = AnyTuple<Option>,
	GenericSubject extends Subjects = Subjects,
> {
	description?: string;
	options?: (
		& GenericOptions
		& ForbiddenDuplicateName<GenericOptions, "option">
	);

	/**
	 * {@include command/create/properties/subjects.md}
	 */
	subjects?: (
		& GenericSubject
		& (
			Extract<
				(
					| [ForbiddenDuplicateName<GenericSubject, "subject">]
					| [ForbiddenBadOrderArguments<GenericSubject>]
				),
				[ComputedTypeError<string>]
			> extends [infer InferredResult]
				? NeverCoalescing<InferredResult, unknown>
				: unknown
		)
	);
}

export type CreateCommandExecuteParams<
	GenericOptions extends AnyTuple<Option>,
	GenericArguments extends AnyTuple<Argument>,
> = (
	& (
		IsEqual<GenericOptions, never> extends true
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
		IsEqual<GenericArguments, never> extends true
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

/**
 * {@include command/create/index.md}
 */
export function create<
	GenericName extends string,
>(
	name: GenericName,
	execute: () => void,
): Command<GenericName>;

export function create<
	GenericName extends string,
	const GenericOptions extends AnyTuple<Option> = never,
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
			Extract<GenericSubjects, AnyTuple<Argument>>
		>,
	) => MaybePromise<void>,
): Command<GenericName>;

export function create(
	...args: [string, AnyFunction] | [
		string,
		CreateCommandParams<
			AnyTuple<Option>,
			Subjects
		>,
		AnyFunction,
	]
): Command {
	const [name, params, execute] = args.length === 2
		? [args[0], {}, args[1]]
		: args;

	const self: Command = commandKind.setTo(
		{
			name,
			description: params.description ?? null,
			options: params.options ?? [],
			subject: justExec((): CommandSubject | null => {
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
							error.currentCommandPath[
								error.currentCommandPath.length
							] = command.name;
							return command.execute(AA.shift(args), error);
						}
					}
				}

				const help = await helpOption.execute(args, error);

				if (help === SymbolCommandError) {
					return SymbolCommandError;
				} else if (help.result) {
					logCommandHelp(self);
					return void exitProcess(0);
				}

				const commandOptions = await GG.asyncReduce(
					self.options,
					GG.reduceFrom<{
						options: Record<string, unknown>;
						restArgs: readonly string[];
					}>({
						options: {},
						restArgs: args,
					}),
					async({ element: option, lastValue, next, exit }) => {
						const optionResult = await option.execute(lastValue.restArgs, error);

						if (optionResult === SymbolCommandError) {
							return exit(SymbolCommandError);
						}

						return next({
							options: OO.override(
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
						const expectedCount = self.subject.args.length;
						const receivedCount = commandOptions.restArgs.length;

						addIssue(
							error,
							{
								type: "command",
								expected: `${expectedCount} declared argument${expectedCount > 1 ? "s" : ""}`,
								received: commandOptions.restArgs,
								message: `Declared arguments count does not match received arguments count: expected ${expectedCount}, received ${receivedCount}.`,
							},
						);

						return SymbolCommandError;
					}

					const commandArguments = await GG.asyncReduce(
						self.subject.args,
						GG.reduceFrom<{
							args: Record<string, unknown>;
							restArgs: readonly string[];
						}>({
							args: {},
							restArgs: commandOptions.restArgs,
						}),
						async({ element: argument, lastValue, next, exit }) => {
							const firstArgument = AA.first(lastValue.restArgs);

							const argumentResult = await argument.execute(firstArgument, error);

							if (argumentResult === SymbolCommandError) {
								return exit(SymbolCommandError);
							}

							return next({
								args: OO.override(
									lastValue.args,
									{ [argument.name]: argumentResult },
								),
								restArgs: AA.shift(lastValue.restArgs),
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
						addIssue(
							error,
							{
								type: "command",
								expected: "existing child command",
								received: commandOptions.restArgs[0],
								message: `Unknown child command "${commandOptions.restArgs[0]}".`,
							},
						);
						return SymbolCommandError;
					}

					await execute({ options: commandOptions.options });
				}

				return;
			},
		} satisfies RemoveKind<Command>,
	);

	return self;
}
