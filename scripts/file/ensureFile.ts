import * as DEither from "@duplojs/lang/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerFunction {
		ensureFile<
			GenericPath extends string,
		>(path: GenericPath): Promise<FileSystemLeft<"ensure-file"> | DEither.Ok>;
	}
}

export const ensureFile = implementFunction(
	"ensureFile",
	{
		NODE: async(path: string) => {
			const fs = await nodeFileSystem.value;

			return fs.open(path, "a")
				.then((fh) => fh.close())
				.then(DEither.ok)
				.catch((value) => DEither.left("file-system-ensure-file", value));
		},
		DENO: (path: string) => Deno.open(path, {
			write: true,
			create: true,
			append: true,
		})
			.then((fh) => void fh.close())
			.then(DEither.ok)
			.catch((value) => DEither.left("file-system-ensure-file", value)),
	},
);
