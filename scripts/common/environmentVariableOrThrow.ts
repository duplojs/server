import { kindHeritage, unwrap } from "@duplojs/lang";
import * as DEither from "@duplojs/lang/either";
import type * as DDP from "@duplojs/lang/dataParser";
import { createKind } from "@scripts/kind";
import type * as SF from "@scripts/file";
import { type EnvironmentVariableFileParams, environmentVariable } from "./environmentVariable";

export class EnvironmentVariableError extends kindHeritage(
	"environment-variable-error",
	createKind("environment-variable-error"),
	Error,
) {
	public constructor(
		public error: SF.FileSystemLeft<"read-text-file"> | DEither.Error<DDP.DataParserError>,
	) {
		super({}, ["Failed to load environment variables: one env file could not be read or parsed values do not match the provided schema."]);
	}
}

export async function environmentVariableOrThrow<
	GenericShape extends DDP.DataParserObjectShape,
>(
	shape: GenericShape,
	envFileParams?: EnvironmentVariableFileParams,
): Promise<DDP.DataParserObjectShapeOutput<GenericShape>> {
	const result = await environmentVariable(shape, envFileParams);

	if (DEither.isLeft(result)) {
		throw new EnvironmentVariableError(result);
	}

	return unwrap(result);
}
