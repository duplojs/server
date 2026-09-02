import * as DCommon from "@duplojs/lang/common";
import type * as DKind from "@duplojs/lang/kind";
import * as DArray from "@duplojs/lang/array";
import * as DString from "@duplojs/lang/string";
import { createKind } from "@scripts/kind";
import { type Error, SymbolCommandError } from "../error";

export const optionKind = createKind("command-option");
const regexOption = /^(?<dashes>-{1,2})(?<key>[A-Za-z0-9][A-Za-z0-9_-]*)(?:=(?<value>.*))?$/;

export interface Option<
	GenericName extends string = string,
	GenericValue extends unknown = unknown,
> extends DKind.Kind<typeof optionKind> {
	readonly name: GenericName;
	readonly description: string | null;
	readonly aliases: readonly string[];
	execute(
		args: readonly string[],
		error: Error,
	): Promise<
		| {
			result: GenericValue;
			argumentRest: readonly string[];
		}
		| SymbolCommandError
	>;
}

export interface CreateOptionInitParams {
	description: string | null;
	aliases: readonly string[];
}

export type CreateOptionInitRest<
	GenericOption extends Option = Option,
> = {
	[Prop in Exclude<keyof GenericOption, keyof Option>]: GenericOption[Prop] extends DCommon.AnyFunction
		? (self: GenericOption, ...args: Parameters<GenericOption[Prop]>) => ReturnType<GenericOption[Prop]>
		: GenericOption[Prop]
};

export interface CreateOptionConstructorParams<
	GenericKindHandler extends DKind.Handler = DKind.Handler,
> {
	init<
		GenericOption extends (
			& Option
			& DKind.Kind<GenericKindHandler>
		),
	>(
		name: GenericOption["name"],
		execute: (
			self: GenericOption,
			value: string | undefined | null,
			error: Error,
		) => DCommon.MaybePromise<
			| Extract<Awaited<ReturnType<GenericOption["execute"]>>, object>["result"]
			| SymbolCommandError
		>,
		params: CreateOptionInitParams,
		...args: DCommon.IsNever<Exclude<keyof GenericOption, keyof Option>> extends true
			? []
			: [rest: CreateOptionInitRest<GenericOption>]
	): NoInfer<GenericOption>;
}

export function createOption<
	GenericKindHandler extends DKind.Handler,
	GenericConstructor extends (
		(...args: any[]) => (
			& Option
			& DKind.Kind<GenericKindHandler>
		)
	),
>(
	kindHandler: GenericKindHandler,
	createConstructor: (
		params: CreateOptionConstructorParams<
			GenericKindHandler
		>,
	) => GenericConstructor,
): GenericConstructor;

export function createOption(
	kindHandler: DKind.Handler,
	createConstructor: (
		params: CreateOptionConstructorParams,
	) => Option,
): Option {
	return createConstructor({
		init: (
			name,
			execute,
			params,
			...rest
		) => {
			const self: Option = {
				...Object.fromEntries(
					Object
						.entries(rest[0] ?? {})
						.map(
							([key, prop]) => typeof prop === "function"
								? [key, (...args: never[]) => (prop as DCommon.AnyFunction)(self, ...args)]
								: [key, prop],
						),
				),
				name,
				execute: async(
					args: readonly string[],
					error: Error,
				) => {
					const result = DArray.reduce(
						args,
						DArray.reduceFrom(null),
						({ element, next, exit, index }) => {
							const extractResult = DString.extract(element, regexOption);

							if (!extractResult) {
								return next(null);
							}

							const result = {
								key: extractResult.namedGroups!.key!,
								value: extractResult.namedGroups?.value,
								index,
							};

							if (self.name !== result.key && !DArray.includes(self.aliases, result.key)) {
								return next(null);
							}

							return exit(result);
						},
					);

					const { value, argumentRest } = DCommon.justExec(() => {
						if (!result) {
							return {
								value: null,
								argumentRest: args,
							};
						}

						if (result.value === undefined) {
							const nextArg = args[result.index + 1];

							if (nextArg === undefined || DString.test(nextArg, regexOption)) {
								return {
									value: undefined,
									argumentRest: DArray.spliceDelete(args, result.index, 1),
								};
							}

							return {
								value: nextArg,
								argumentRest: DArray.spliceDelete(args, result.index, 2),
							};
						}

						return {
							value: result.value,
							argumentRest: DArray.spliceDelete(args, result.index, 1),
						};
					});

					const executeResult = await execute(
						self as never,
						value,
						error,
					);

					if (executeResult === SymbolCommandError) {
						return SymbolCommandError;
					}

					return {
						result: executeResult,
						argumentRest,
					};
				},
				aliases: params?.aliases ?? [],
				description: params?.description ?? null,
				[optionKind.runTimeKey]: null,
				[kindHandler.runTimeKey]: null,
			} satisfies DKind.Remove<Option> as never;

			return self as never;
		},
	});
}
