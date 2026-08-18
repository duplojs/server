import * as EE from "@duplojs/utils/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerUtilsFunction {
		writeTextFile(
			path: string,
			data: string,
		): Promise<FileSystemLeft<"write-text-file"> | EE.Ok>;
	}
}

/**
 * {@include file/writeTextFile/index.md}
 */
export const writeTextFile = implementFunction(
	"writeTextFile",
	{
		NODE: async(path, data) => {
			const fs = await nodeFileSystem.value;
			return fs.writeFile(
				path,
				data,
				{ encoding: "utf-8" },
			)
				.then(EE.ok)
				.catch((value) => EE.left("file-system-write-text-file", value));
		},
		DENO: (path, data) => Deno
			.writeTextFile(
				path,
				data,
			)
			.then(EE.ok)
			.catch((value) => EE.left("file-system-write-text-file", value)),
		BUN: (path, data) => Bun
			.file(path)
			.write(data)
			.then(EE.ok)
			.catch((value) => EE.left("file-system-write-text-file", value)),
	},
);
