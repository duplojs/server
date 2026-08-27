import * as DEither from "@duplojs/lang/either";
import type * as DPath from "@duplojs/lang/path";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerFunction {
		readFile<
			GenericPath extends string & DPath.Path,
		>(
			path: GenericPath
		): Promise<FileSystemLeft<"read-file"> | DEither.Success<Uint8Array>>;
	}
}

export const readFile = implementFunction(
	"readFile",
	{
		NODE: async(path) => {
			const fs = await nodeFileSystem.value;
			return fs.readFile(path)
				.then(DEither.success)
				.catch((value) => DEither.left("file-system-read-file", value));
		},
		DENO: (path) => Deno
			.readFile(path)
			.then(DEither.success)
			.catch((value) => DEither.left("file-system-read-file", value)),
		BUN: (path) => Bun.file(path)
			.bytes()
			.then(DEither.success)
			.catch((value) => DEither.left("file-system-read-file", value)),
	},
);
