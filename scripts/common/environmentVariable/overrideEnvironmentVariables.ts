import * as DCommon from "@duplojs/lang/common";
import * as DObject from "@duplojs/lang/object";
import * as DArray from "@duplojs/lang/array";

export function overrideEnvironmentVariables(
	arrayEnv: Record<string, string>[],
	override: boolean,
) {
	return DCommon.pipe(
		arrayEnv,
		DArray.map(DObject.entries),
		DArray.flat,
		(entries) => override
			? entries
			: DArray.reverse(entries),
		DObject.fromEntries,
	);
}
