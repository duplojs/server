import type * as DCommon from "@duplojs/lang/common";
import * as DEither from "@duplojs/lang/either";
import * as DGenerator from "@duplojs/lang/generator";
import * as DObject from "@duplojs/lang/object";
import type * as DDataStructure from "@duplojs/lang/dataStructure";
import * as DServerCommon from "@scripts/common";
import { createError, interpretExecOptionsError, SymbolCommandError, type Error } from "./error";
import { logExecOptionHelp, helpOption } from "./help";
import type { Option } from "./options";
import type { ForbiddenDuplicateName } from "./types";

type ComputeResult<
	GenericOptions extends DCommon.AnyTuple<Option>,
> = DCommon.SimplifyTopLevel<{
	readonly [GenericOption in GenericOptions[number] as GenericOption extends Option<infer GenericName, unknown>
		? GenericName
		: never
	]: GenericOption extends Option<string, infer GenericResult>
		? GenericResult
		: never
}>;

export interface ExecOptionsParams {
	dataStructureErrorInterpreter?: DDataStructure.ErrorInterpreter;
}

export function execOptions<
	GenericOptions extends DCommon.AnyTuple<Option>,
>(
	options: GenericOptions & ForbiddenDuplicateName<GenericOptions, "option">,
	params?: ExecOptionsParams,
): Promise<
	| DEither.Success<
		Extract<
			ComputeResult<GenericOptions>,
			any
		>
	>
	| DEither.Right<"log-help">
	| DEither.Error<Error>
>;

export async function execOptions(
	options: DCommon.AnyTuple<Option>,
	params?: ExecOptionsParams,
) {
	const processArguments = DServerCommon.getProcessArguments();
	const error = createError("root");
	const help = await helpOption.execute(processArguments, error);

	if (help === SymbolCommandError) {
		// oxlint-disable-next-line no-console
		console.error(interpretExecOptionsError(error, params?.dataStructureErrorInterpreter));
		return DEither.error(error);
	} else if (help.result) {
		logExecOptionHelp(options);
		return DEither.right("log-help");
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

	if (result === SymbolCommandError) {
		// oxlint-disable-next-line no-console
		console.error(interpretExecOptionsError(error, params?.dataStructureErrorInterpreter));
		return DEither.error(error);
	}

	return DEither.success(result.options);
}
