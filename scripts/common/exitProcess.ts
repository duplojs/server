import { implementFunction } from "@scripts/implementor";

declare module "@scripts/implementor" {
	interface ServerFunction {
		exitProcess(code?: number): void;
	}
}

export const exitProcess = implementFunction(
	"exitProcess",
	{
		NODE: (code) => process.exit(code),
		DENO: (code) => Deno.exit(code),
	},
);
