import { implementFunction } from "@scripts/implementor";

/**
 * {@include common/getCurrentWorkDirectoryOrThrow/index.md}
 */
export const getCurrentWorkDirectoryOrThrow = implementFunction(
	"getCurrentWorkDirectoryOrThrow",
	{
		NODE: () => process.cwd(),
		DENO: () => Deno.cwd(),
	},
);
