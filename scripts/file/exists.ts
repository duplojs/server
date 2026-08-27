import * as DEither from "@duplojs/lang/either";
import type * as DPath from "@duplojs/lang/path";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerFunction {
		exists<
			GenericPath extends string & DPath.Path,
		>(
			path: GenericPath,
		): Promise<FileSystemLeft<"exists"> | DEither.Ok>;
	}
}

export const exists = implementFunction(
	"exists",
	{
		NODE: async(path) => {
			const fs = await nodeFileSystem.value;
			return fs.access(path)
				.then(DEither.ok)
				.catch((value) => DEither.left("file-system-exists", value));
		},
		DENO: (path) => Deno
			.stat(path)
			.then(DEither.ok)
			.catch((value) => DEither.left("file-system-exists", value)),
		BUN: (path) => Bun.file(path)
			.exists()
			.then(
				(value) => value
					? DEither.ok()
					: DEither.left("file-system-exists", new Error("Path does not exist")),
			)
			.catch((value) => DEither.left("file-system-exists", value)),
	},
);
