import { pipe } from "@duplojs/lang";
import * as OO from "@duplojs/lang/object";
import * as AA from "@duplojs/lang/array";

export function overrideEnvironmentVariables(
	arrayEnv: Record<string, string>[],
	override: boolean,
) {
	return pipe(
		arrayEnv,
		AA.map(OO.entries),
		AA.flat,
		(entries) => override
			? entries
			: AA.reverse(entries),
		OO.fromEntries,
	);
}
