import * as EE from "@duplojs/utils/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerUtilsFunction {
		ensureFile<
			GenericPath extends string,
		>(path: GenericPath): Promise<FileSystemLeft<"ensure-file"> | EE.Ok>;
	}
}

/**
 * {@include file/ensureFile/index.md}
 */
export const ensureFile = implementFunction(
	"ensureFile",
	{
		NODE: async(path: string) => {
			const fs = await nodeFileSystem.value;

			return fs.open(path, "a")
				.then((fh) => fh.close())
				.then(EE.ok)
				.catch((value) => EE.left("file-system-ensure-file", value));
		},
		DENO: (path: string) => Deno.open(path, {
			write: true,
			create: true,
			append: true,
		})
			.then((fh) => void fh.close())
			.then(EE.ok)
			.catch((value) => EE.left("file-system-ensure-file", value)),
	},
);
