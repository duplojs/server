import * as DEither from "@duplojs/lang/either";
import type * as DDataStructure from "@duplojs/lang/dataStructure";
import * as DKind from "@duplojs/lang/kind";
import { createKind } from "@scripts/kind";
import type * as DServerFile from "@scripts/file";
import { type EnvironmentVariableFileParams, environmentVariable } from "./environmentVariable";

export class EnvironmentVariableError extends DKind.parentClass(
	createKind("environment-variable-error"),
	Error,
) {
	public constructor(
		public error: (
			| DServerFile.FileSystemLeft<"read-text-file">
			| DEither.Left<"decode-error", DDataStructure.Error>
		),
	) {
		super(null, "Failed to load environment variables: one env file could not be read or parsed values do not match the provided schema.");
	}
}

export async function environmentVariableOrThrow<
	GenericShape extends DDataStructure.ShapeObjectStructure,
>(
	shape: GenericShape,
	envFileParams?: EnvironmentVariableFileParams,
): Promise<DDataStructure.ShapeObjectStructureValue<GenericShape>> {
	const result = await environmentVariable(shape, envFileParams);

	if (DEither.isLeft(result)) {
		throw new EnvironmentVariableError(result);
	}

	return DEither.unwrapRight(result);
}
