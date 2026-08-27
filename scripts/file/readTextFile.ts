import * as DEither from "@duplojs/lang/either";
import type * as DPath from "@duplojs/lang/path";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerFunction {
		readTextFile<
			GenericPath extends string & DPath.Path,
		>(
			path: GenericPath,
		): Promise<FileSystemLeft<"read-text-file"> | DEither.Success<string>>;
	}
}

export const readTextFile = implementFunction(
	"readTextFile",
	{
		NODE: async(path) => {
			const fs = await nodeFileSystem.value;
			return fs.readFile(path, { encoding: "utf-8" })
				.then(DEither.success)
				.catch((value) => DEither.left("file-system-read-text-file", value));
		},
		DENO: (path) => Deno
			.readTextFile(path)
			.then(DEither.success)
			.catch((value) => DEither.left("file-system-read-text-file", value)),
		BUN: (path) => Bun.file(path)
			.text()
			.then(DEither.success)
			.catch((value) => DEither.left("file-system-read-text-file", value)),
	},
);
