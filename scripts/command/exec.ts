import type * as DCommon from "@duplojs/lang/common";
import * as DEither from "@duplojs/lang/either";
import * as DServerCommon from "@scripts/common";
import { type CreateCommandExecuteParams, type CreateCommandParams, type Subjects, create } from "./create";
import { createError, interpretCommandError, SymbolCommandError, type Error } from "./error";
import type { Option } from "./options";
import type { Argument } from "./argument";

export interface ExecCommandParams<
	GenericOptions extends DCommon.AnyTuple<Option> = DCommon.AnyTuple<Option>,
	GenericSubjects extends Subjects = Subjects,
> extends CreateCommandParams<
		GenericOptions,
		GenericSubjects
	> {
	displayName?: string;
}

export function exec(
	execute: () => void,
): Promise<
	| DEither.Ok
	| DEither.Error<Error>
>;

export function exec<
	const GenericOptions extends DCommon.AnyTuple<Option> = never,
	GenericSubjects extends Subjects = never,
>(
	params: ExecCommandParams<
		GenericOptions,
		GenericSubjects
	>,
	execute: (
		params: CreateCommandExecuteParams<
			GenericOptions,
			Extract<
				GenericSubjects,
				DCommon.AnyTuple<Argument>
			>
		>,
	) => DCommon.MaybePromise<void>,
): Promise<
	| DEither.Ok
	| DEither.Error<Error>
>;

export async function exec(
	...args: [DCommon.AnyFunction] | [ExecCommandParams, DCommon.AnyFunction]
) {
	const [params, execute] = args.length === 1
		? [{}, args[0]]
		: args;

	const displayName = params.displayName ?? "root";

	const error = createError(displayName);

	const result = await create(
		displayName,
		params,
		execute,
	).execute(
		DServerCommon.getProcessArguments(),
		error,
	);

	if (result === SymbolCommandError) {
		// eslint-disable-next-line no-console
		console.error(interpretCommandError(error));
		return DEither.error(error);
	}

	return DEither.ok();
}
