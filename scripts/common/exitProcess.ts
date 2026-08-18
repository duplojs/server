import { implementFunction } from "@scripts/implementor";

declare module "@scripts/implementor" {
	interface ServerUtilsFunction {
		exitProcess(code?: number): void;
	}
}

/**
 * {@include common/exitProcess/index.md}
 */
export const exitProcess = implementFunction(
	"exitProcess",
	{
		NODE: (code) => process.exit(code),
		DENO: (code) => Deno.exit(code),
	},
);
