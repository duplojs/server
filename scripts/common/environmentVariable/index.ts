import { A, DP, E, O, pipe, unwrap } from "@duplojs/utils";
import { implementFunction } from "@scripts/implementor";
import type * as SF from "@scripts/file";
import { parseEnvironmentFiles } from "./parseEnvironmentFiles";
import { expandEnvironmentVariables } from "./expandEnvironmentVariables";
import { overrideEnvironmentVariables } from "./overrideEnvironmentVariables";

export interface EnvironmentVariableFileParams {

	/**
	 * {@include common/environmentVariable/properties/includedFiles.md}
	 */
	includedFiles?: string[];

	/**
	 * @deprecated This property has been replaced by `includedFiles`.
	 */
	paths?: string[];

	/**
	 * {@include common/environmentVariable/properties/override.md}
	 */
	override?: boolean;

	/**
	 * {@include common/environmentVariable/properties/justRead.md}
	 */
	justRead?: boolean;
}

/**
 * @deprecated Use `EnvironmentVariableFileParams` instead.
 */
export type EnvironmentVariableParams = EnvironmentVariableFileParams;

declare module "@scripts/implementor" {
	interface ServerUtilsFunction {
		environmentVariable<
			GenericShape extends DP.DataParserObjectShape,
		>(
			shape: GenericShape,
			envFileParams?: EnvironmentVariableFileParams,
		): Promise<
			| E.Success<DP.DataParserObjectShapeOutput<GenericShape>>
			| SF.FileSystemLeft<"read-text-file">
			| E.Error<DP.DataParserError>
		>;
	}
}

/**
 * {@include common/environmentVariable/index.md}
 */
export const environmentVariable = implementFunction(
	"environmentVariable",
	{
		NODE: async(shape, envFileParams) => {
			const baseEnv = pipe(
				process.env,
				O.entries,
				A.filter((entry) => entry[1] !== undefined),
				O.fromEntries,
			);

			const parseEnvFileResult = await parseEnvironmentFiles(
				baseEnv,
				envFileParams?.includedFiles ?? envFileParams?.paths ?? [],
			);

			if (E.isLeft(parseEnvFileResult)) {
				return parseEnvFileResult;
			}

			const overrideEnvResult = overrideEnvironmentVariables(
				parseEnvFileResult,
				envFileParams?.override ?? false,
			);

			const expandEnvResult = expandEnvironmentVariables(overrideEnvResult);

			const schema = DP.object(shape);
			const parsedEnvResult = schema.parse(expandEnvResult);

			if (E.isLeft(parsedEnvResult)) {
				return parsedEnvResult;
			}

			if (envFileParams?.justRead !== true) {
				process.env = unwrap(expandEnvResult);
			}

			return parsedEnvResult;
		},
		DENO: async(shape, envFileParams) => {
			const parseEnvFileResult = await parseEnvironmentFiles(
				Deno.env.toObject(),
				envFileParams?.includedFiles ?? envFileParams?.paths ?? [],
			);

			if (E.isLeft(parseEnvFileResult)) {
				return parseEnvFileResult;
			}

			const overrideEnvResult = overrideEnvironmentVariables(
				parseEnvFileResult,
				envFileParams?.override ?? false,
			);

			const expandEnvResult = expandEnvironmentVariables(overrideEnvResult);

			const schema = DP.object(shape);
			const parsedEnvResult = schema.parse(expandEnvResult);

			if (E.isLeft(parsedEnvResult)) {
				return parsedEnvResult;
			}

			if (envFileParams?.justRead !== true) {
				for (const [key, value] of O.entries(expandEnvResult)) {
					if (value) {
						Deno.env.set(key, value);
					}
				}
			}

			return parsedEnvResult;
		},
	},
);
