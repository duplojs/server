import type { AnyFunction, AnyTuple, MaybePromise } from "@duplojs/utils";
import { exitProcess, getProcessArguments } from "@scripts/common";
import { type CreateCommandExecuteParams, type CreateCommandParams, type Subjects, create } from "./create";
import { createError, interpretCommandError, SymbolCommandError } from "./error";
import type { Option } from "./options";
import type { Argument } from "./argument";

export type ExecCommandParams<
	GenericOptions extends AnyTuple<Option> = AnyTuple<Option>,
	GenericSubjects extends Subjects = Subjects,
> = (
	& CreateCommandParams<
		GenericOptions,
		GenericSubjects
	> & {

		/**
		 * {@include command/exec/properties/displayName.md}
		 */
		displayName?: string;
	}
);

/**
 * {@include command/exec/index.md}
 */
export function exec(
	execute: () => void,
): Promise<void>;

export function exec<
	const GenericOptions extends AnyTuple<Option> = never,
	GenericSubjects extends Subjects = never,
>(
	params: ExecCommandParams<
		GenericOptions,
		GenericSubjects
	>,
	execute: (
		params: CreateCommandExecuteParams<
			GenericOptions,
			Extract<GenericSubjects, AnyTuple<Argument>>
		>,
	) => MaybePromise<void>,
): Promise<void>;

export async function exec(
	...args: [AnyFunction] | [ExecCommandParams, AnyFunction]
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
		getProcessArguments(),
		error,
	);

	if (result === SymbolCommandError) {
		// eslint-disable-next-line no-console
		console.error(interpretCommandError(error));
		return void exitProcess(1);
	}
}
