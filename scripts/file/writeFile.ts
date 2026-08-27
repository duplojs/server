import * as DEither from "@duplojs/lang/either";
import type * as DPath from "@duplojs/lang/path";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerFunction {
		writeFile(
			path: string & DPath.Path,
			data: Uint8Array,
		): Promise<FileSystemLeft<"write-file"> | DEither.Ok>;
	}
}

export const writeFile = implementFunction(
	"writeFile",
	{
		NODE: async(path, data) => {
			const fs = await nodeFileSystem.value;
			return fs.writeFile(
				path,
				data,
			)
				.then(DEither.ok)
				.catch((value) => DEither.left("file-system-write-file", value));
		},
		DENO: (path, data) => Deno
			.writeFile(
				path,
				data,
			)
			.then(DEither.ok)
			.catch((value) => DEither.left("file-system-write-file", value)),
		BUN: (path, data) => Bun
			.file(path)
			.write(data)
			.then(DEither.ok)
			.catch((value) => DEither.left("file-system-write-file", value)),
	},
);
