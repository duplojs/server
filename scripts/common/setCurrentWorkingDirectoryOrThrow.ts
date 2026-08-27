import { kindHeritage } from "@duplojs/lang";
import * as DEither from "@duplojs/lang/either";
import { createKind } from "@scripts/kind";
import { setCurrentWorkingDirectory } from "./setCurrentWorkingDirectory";

export class SetCurrentWorkingDirectoryError extends kindHeritage(
	"set-working-directory-error",
	createKind("set-working-directory-error"),
	Error,
) {
	public constructor() {
		super({}, ["Failed to set current working directory"]);
	}
}

export function setCurrentWorkingDirectoryOrThrow<
	GenericPath extends string,
>(
	path: GenericPath,
): void {
	const result = setCurrentWorkingDirectory(path);

	if (DEither.isLeft(result)) {
		throw new SetCurrentWorkingDirectoryError();
	}

	return;
}
