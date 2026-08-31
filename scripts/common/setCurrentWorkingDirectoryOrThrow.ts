import * as DCommon from "@duplojs/lang/common";
import * as DEither from "@duplojs/lang/either";
import * as DKind from "@duplojs/lang/kind";
import type * as DPath from "@duplojs/lang/path";
import { createKind } from "@scripts/kind";
import { setCurrentWorkingDirectory } from "./setCurrentWorkingDirectory";

export class SetCurrentWorkingDirectoryError extends DKind.parentClass(
	createKind("set-working-directory-error"),
	Error,
) {
	public constructor() {
		super({}, "Failed to set current working directory");
	}
}

export function setCurrentWorkingDirectoryOrThrow<
	GenericPath extends string & DPath.Path,
>(
	path: GenericPath,
) {
	DEither.whenIsRightOtherwise(
		setCurrentWorkingDirectory(path),
		DCommon.forward,
		() => {
			throw new SetCurrentWorkingDirectoryError();
		},
	);
}
