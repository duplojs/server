import * as DKind from "@duplojs/lang/kind";

declare module "@duplojs/lang" {
	interface ReservedKindNamespace {
		DuplojsServer: true;
	}
}

export const createKind = DKind.createNamespace(
	"DuplojsServer",
);
