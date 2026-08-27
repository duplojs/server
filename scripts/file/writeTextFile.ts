import * as DEither from "@duplojs/lang/either";
import type * as DPath from "@duplojs/lang/path";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerFunction {
		writeTextFile(
			path: string & DPath.Path,
			data: string,
		): Promise<FileSystemLeft<"write-text-file"> | DEither.Ok>;
	}
}

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
				.then(DEither.ok)
				.catch((value) => DEither.left("file-system-write-text-file", value));
		},
		DENO: (path, data) => Deno
			.writeTextFile(
				path,
				data,
			)
			.then(DEither.ok)
			.catch((value) => DEither.left("file-system-write-text-file", value)),
		BUN: (path, data) => Bun
			.file(path)
			.write(data)
			.then(DEither.ok)
			.catch((value) => DEither.left("file-system-write-text-file", value)),
	},
);
