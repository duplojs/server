import { kindHeritage } from "@duplojs/lang";
import * as EE from "@duplojs/lang/either";
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

	if (EE.isLeft(result)) {
		throw new SetCurrentWorkingDirectoryError();
	}

	return;
}
