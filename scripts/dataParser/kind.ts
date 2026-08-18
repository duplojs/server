import { createKindNamespace } from "@duplojs/lang";

declare module "@duplojs/lang" {
	interface ReservedKindNamespace {
		DuplojsServerUtilsDataParser: true;
	}
}

export const createDataParserKind = createKindNamespace(
	// @ts-expect-error reserved kind namespace
	"DuplojsServerUtilsDataParser",
);
