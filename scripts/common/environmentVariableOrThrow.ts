import { kindHeritage, unwrap } from "@duplojs/utils";
import * as EE from "@duplojs/utils/either";
import type * as DDP from "@duplojs/utils/dataParser";
import { createDuplojsServerUtilsKind } from "@scripts/kind";
import type * as SF from "@scripts/file";
import { type EnvironmentVariableFileParams, environmentVariable } from "./environmentVariable";

export class EnvironmentVariableError extends kindHeritage(
	"environment-variable-error",
	createDuplojsServerUtilsKind("environment-variable-error"),
	Error,
) {
	public constructor(
		public error: SF.FileSystemLeft<"read-text-file"> | EE.Error<DDP.DataParserError>,
	) {
		super({}, ["Failed to load environment variables: one env file could not be read or parsed values do not match the provided schema."]);
	}
}

/**
 * {@include common/environmentVariableOrThrow/index.md}
 */
export async function environmentVariableOrThrow<
	GenericShape extends DDP.DataParserObjectShape,
>(
	shape: GenericShape,
	envFileParams?: EnvironmentVariableFileParams,
): Promise<DDP.DataParserObjectShapeOutput<GenericShape>> {
	const result = await environmentVariable(shape, envFileParams);

	if (EE.isLeft(result)) {
		throw new EnvironmentVariableError(result);
	}

	return unwrap(result);
}
