import * as DCommon from "@duplojs/lang/common";
import * as DDataStructure from "@duplojs/lang/dataStructure";
import * as DEither from "@duplojs/lang/either";
import * as DObject from "@duplojs/lang/object";
import * as DArray from "@duplojs/lang/array";
import type * as DPath from "@duplojs/lang/path";
import type * as DServerFile from "@scripts/file";
import { implementFunction } from "@scripts/implementor";
import { parseEnvironmentFiles } from "./parseEnvironmentFiles";
import { expandEnvironmentVariables } from "./expandEnvironmentVariables";
import { overrideEnvironmentVariables } from "./overrideEnvironmentVariables";

export interface EnvironmentVariableFileParams {
	includedEnvironmentFiles?: (string & DPath.Path)[];
	override?: boolean;
	justRead?: boolean;
	codecs?: DDataStructure.Codecs;
}

declare module "@scripts/implementor" {
	interface ServerFunction {
		environmentVariable<
			GenericShape extends DDataStructure.ShapeObjectStructure,
		>(
			shape: GenericShape,
			envFileParams?: EnvironmentVariableFileParams,
		): Promise<
			| DEither.Right<"decode-success", DDataStructure.ShapeObjectStructureValue<GenericShape>>
			| DServerFile.FileSystemLeft<"read-text-file">
			| DEither.Left<"decode-error", DDataStructure.Error>
		>;
	}
}

export const environmentVariable = implementFunction(
	"environmentVariable",
	{
		NODE: async(shape, envFileParams) => {
			const baseEnv = DCommon.pipe(
				process.env,
				DObject.entries,
				DArray.filter((entry) => entry[1] !== undefined),
				DObject.fromEntries,
			);

			const parseEnvFileResult = await parseEnvironmentFiles(
				baseEnv,
				envFileParams?.includedEnvironmentFiles ?? [],
			);

			if (DEither.isLeft(parseEnvFileResult)) {
				return parseEnvFileResult;
			}

			const overrideEnvResult = overrideEnvironmentVariables(
				parseEnvFileResult,
				envFileParams?.override ?? false,
			);

			const expandEnvResult = expandEnvironmentVariables(overrideEnvResult);

			const schema = DDataStructure.object(shape);
			const parsedEnvResult = await schema.asyncUnsafeDecode(
				envFileParams?.codecs ?? DDataStructure.codecsString,
				expandEnvResult,
			);

			if (DEither.isLeft(parsedEnvResult)) {
				return parsedEnvResult;
			}

			if (envFileParams?.justRead !== true) {
				process.env = expandEnvResult;
			}

			return parsedEnvResult;
		},
		DENO: async(shape, envFileParams) => {
			const parseEnvFileResult = await parseEnvironmentFiles(
				Deno.env.toObject(),
				envFileParams?.includedEnvironmentFiles ?? [],
			);

			if (DEither.isLeft(parseEnvFileResult)) {
				return parseEnvFileResult;
			}

			const overrideEnvResult = overrideEnvironmentVariables(
				parseEnvFileResult,
				envFileParams?.override ?? false,
			);

			const expandEnvResult = expandEnvironmentVariables(overrideEnvResult);

			const schema = DDataStructure.object(shape);
			const parsedEnvResult = await schema.asyncUnsafeDecode(
				envFileParams?.codecs ?? DDataStructure.codecsString,
				expandEnvResult,
			);

			if (DEither.isLeft(parsedEnvResult)) {
				return parsedEnvResult;
			}

			if (envFileParams?.justRead !== true) {
				for (const [key, value] of DObject.entries(expandEnvResult)) {
					if (value) {
						Deno.env.set(key, value);
					} else {
						Deno.env.delete(key);
					}
				}
			}

			return parsedEnvResult;
		},
	},
);
