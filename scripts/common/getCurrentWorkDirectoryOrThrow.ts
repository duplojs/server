import { implementFunction } from "@scripts/implementor";

export const getCurrentWorkDirectoryOrThrow = implementFunction(
	"getCurrentWorkDirectoryOrThrow",
	{
		NODE: () => process.cwd(),
		DENO: () => Deno.cwd(),
	},
);
