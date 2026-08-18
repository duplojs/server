import * as EE from "@duplojs/utils/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerUtilsFunction {
		readTextFile<
			GenericPath extends string,
		>(
			path: GenericPath,
		): Promise<FileSystemLeft<"read-text-file"> | EE.Success<string>>;
	}
}

/**
 * {@include file/readTextFile/index.md}
 */
export const readTextFile = implementFunction(
	"readTextFile",
	{
		NODE: async(path) => {
			const fs = await nodeFileSystem.value;
			return fs.readFile(path, { encoding: "utf-8" })
				.then(EE.success)
				.catch((value) => EE.left("file-system-read-text-file", value));
		},
		DENO: (path) => Deno
			.readTextFile(path)
			.then(EE.success)
			.catch((value) => EE.left("file-system-read-text-file", value)),
		BUN: (path) => Bun.file(path)
			.text()
			.then(EE.success)
			.catch((value) => EE.left("file-system-read-text-file", value)),
	},
);
