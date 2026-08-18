import { kindHeritage } from "@duplojs/utils";
import * as EE from "@duplojs/utils/either";
import { createDuplojsServerUtilsKind } from "@scripts/kind";
import { setCurrentWorkingDirectory } from "./setCurrentWorkingDirectory";

export class SetCurrentWorkingDirectoryError extends kindHeritage(
	"set-working-directory-error",
	createDuplojsServerUtilsKind("set-working-directory-error"),
	Error,
) {
	public constructor() {
		super({}, ["Failed to set current working directory"]);
	}
}

/**
 * {@include common/setCurrentWorkingDirectoryOrThrow/index.md}
 */
export function setCurrentWorkingDirectoryOrThrow<
	GenericPath extends string,
>(
	path: GenericPath,
): void {
	const result = setCurrentWorkingDirectory(path);

	if (EE.isLeft(result)) {
		throw new SetCurrentWorkingDirectoryError();
	}

	return;
}
