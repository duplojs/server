import * as DCommon from "@duplojs/lang/common";
import * as DEither from "@duplojs/lang/either";
import * as DKind from "@duplojs/lang/kind";
import { getCurrentWorkDirectory } from "./getCurrentWorkDirectory";
import { createKind } from "@scripts/kind";

export class GetCurrentWorkDirectoryError extends DKind.parentClass(
	createKind("environment-variable-error"),
	Error,
) {
	public constructor(
		public error: unknown,
	) {
		super(null, "Failed to retrieve the current directory path.");
	}
}

export function getCurrentWorkDirectoryOrThro() {
	return DEither.whenIsRightOtherwise(
		getCurrentWorkDirectory(),
		DCommon.forward,
		(result) => {
			throw new GetCurrentWorkDirectoryError(
				DEither.unwrapLeft(result),
			);
		},
	);
}
