import * as EE from "@duplojs/utils/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerUtilsFunction {
		copy(
			fromPath: string,
			toPath: string,
		): Promise<FileSystemLeft<"copy"> | EE.Ok>;
	}
}

/**
 * {@include file/copy/index.md}
 */
export const copy = implementFunction(
	"copy",
	{
		NODE: async(fromPath, toPath) => {
			const fs = await nodeFileSystem.value;
			return fs.cp(
				fromPath,
				toPath,
				{ recursive: true },
			)
				.then(EE.ok)
				.catch((value) => EE.left("file-system-copy", value));
		},
	},
);
