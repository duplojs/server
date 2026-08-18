import { pipe } from "@duplojs/utils";
import * as EE from "@duplojs/utils/either";
import { implementFunction } from "@scripts/implementor";

declare module "@scripts/implementor" {
	interface ServerUtilsFunction {
		getCurrentWorkDirectory(): EE.Error<unknown> | EE.Success<string>;
		getCurrentWorkDirectoryOrThrow(): string;
	}
}

/**
 * {@include common/getCurrentWorkDirectory/index.md}
 */
export const getCurrentWorkDirectory = implementFunction(
	"getCurrentWorkDirectory",
	{
		NODE: () => pipe(
			EE.safeCallback(() => EE.success(process.cwd())),
			EE.whenIsLeft(EE.error),
		),
		DENO: () => pipe(
			EE.safeCallback(() => EE.success(Deno.cwd())),
			EE.whenIsLeft(EE.error),
		),
	},
);
