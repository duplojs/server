import { createKindNamespace } from "@duplojs/utils";

declare module "@duplojs/utils" {
	interface ReservedKindNamespace {
		DuplojsServerUtils: true;
	}
}

export const createDuplojsServerUtilsKind = createKindNamespace(
	// @ts-expect-error reserved kind namespace
	"DuplojsServerUtils",
);
