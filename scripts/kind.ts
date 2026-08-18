import { createKindNamespace } from "@duplojs/lang";

declare module "@duplojs/lang" {
	interface ReservedKindNamespace {
		DuplojsServerUtils: true;
	}
}

export const createDuplojsServerUtilsKind = createKindNamespace(
	// @ts-expect-error reserved kind namespace
	"DuplojsServerUtils",
);
