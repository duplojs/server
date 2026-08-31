import type { AnyTuple, SimplifyTopLevel } from "@duplojs/lang";
import * as DGenerator from "@duplojs/lang/generator";
import * as DObject from "@duplojs/lang/object";
import { createError, interpretExecOptionError, SymbolCommandError } from "./error";
import { logExecOptionHelp, helpOption } from "./help";
import type { Option } from "./options";
import { exitProcess, getProcessArguments } from "@scripts/common";
import type { ForbiddenDuplicateName } from "./types";

type ComputeResult<
	GenericOptions extends AnyTuple<Option>,
> = SimplifyTopLevel<{
	[GenericOption in GenericOptions[number] as GenericOption extends Option<infer GenericName, unknown>
		? GenericName
		: never
	]: GenericOption extends Option<string, infer GenericResult>
		? GenericResult
		: never
}>;

export function execOptions<
	GenericOptions extends AnyTuple<Option>,
>(
	...options: GenericOptions & ForbiddenDuplicateName<GenericOptions, "option">
): Promise<ComputeResult<GenericOptions>>;

export async function execOptions(
	...options: AnyTuple<Option>
) {
	const processArguments = getProcessArguments();
	const error = createError("root");
	const help = await helpOption.execute(processArguments, error);

	if (help === SymbolCommandError) {
		// eslint-disable-next-line no-console
		console.error(interpretExecOptionError(error));
		return void exitProcess(1);
	} else if (help.result) {
		logExecOptionHelp(options);
		return void exitProcess(0);
	}

	const result = await DGenerator.asyncReduce(
		options,
		DGenerator.reduceFrom<{
			options: Record<string, unknown>;
			restArgs: readonly string[];
		}>({
			options: {},
			restArgs: processArguments,
		}),
		async({ element: option, lastValue, next, exit }) => {
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

	if (result === SymbolCommandError) {
		// eslint-disable-next-line no-console
		console.error(interpretExecOptionError(error));
		return void exitProcess(1);
	}

	return result.options;
}
