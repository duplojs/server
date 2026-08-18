import { implementFunction } from "@scripts/implementor";

declare module "@scripts/implementor" {
	interface ServerFunction {
		getProcessArguments(): string[];
	}
}

let args: string[] | undefined = undefined;

export const getProcessArguments = implementFunction(
	"getProcessArguments",
	{
		NODE: () => {
			if (args) {
				return args;
			}
			args = process.argv.slice(2);

			return args;
		},
		DENO: () => Deno.args,
		BUN: () => {
			if (args) {
				return args;
			}
			args = Bun.argv.slice(2);

			return args;
		},
	},
);
