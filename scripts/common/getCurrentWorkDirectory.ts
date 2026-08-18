import { pipe } from "@duplojs/lang";
import * as EE from "@duplojs/lang/either";
import { implementFunction } from "@scripts/implementor";

declare module "@scripts/implementor" {
	interface ServerFunction {
		getCurrentWorkDirectory(): EE.Error<unknown> | EE.Success<string>;
		getCurrentWorkDirectoryOrThrow(): string;
	}
}

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
