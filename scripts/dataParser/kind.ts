import { createKindNamespace } from "@duplojs/utils";

declare module "@duplojs/utils" {
	interface ReservedKindNamespace {
		DuplojsServerUtilsDataParser: true;
	}
}

export const createDataParserKind = createKindNamespace(
	// @ts-expect-error reserved kind namespace
	"DuplojsServerUtilsDataParser",
);
