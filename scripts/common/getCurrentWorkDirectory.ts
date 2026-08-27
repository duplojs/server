import { pipe } from "@duplojs/lang";
import * as DEither from "@duplojs/lang/either";
import { implementFunction } from "@scripts/implementor";

declare module "@scripts/implementor" {
	interface ServerFunction {
		getCurrentWorkDirectory(): DEither.Error<unknown> | DEither.Success<string>;
		getCurrentWorkDirectoryOrThrow(): string;
	}
}

export const getCurrentWorkDirectory = implementFunction(
	"getCurrentWorkDirectory",
	{
		NODE: () => pipe(
			DEither.safeCallback(() => DEither.success(process.cwd())),
			DEither.whenIsLeft(DEither.error),
		),
		DENO: () => pipe(
			DEither.safeCallback(() => DEither.success(Deno.cwd())),
			DEither.whenIsLeft(DEither.error),
		),
	},
);
