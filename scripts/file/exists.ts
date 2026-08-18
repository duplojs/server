import * as EE from "@duplojs/utils/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerUtilsFunction {
		exists<
			GenericPath extends string,
		>(
			path: GenericPath,
		): Promise<FileSystemLeft<"exists"> | EE.Ok>;
	}
}

/**
 * {@include file/exists/index.md}
 */
export const exists = implementFunction(
	"exists",
	{
		NODE: async(path) => {
			const fs = await nodeFileSystem.value;
			return fs.access(path)
				.then(EE.ok)
				.catch((value) => EE.left("file-system-exists", value));
		},
		DENO: (path) => Deno
			.stat(path)
			.then(EE.ok)
			.catch((value) => EE.left("file-system-exists", value)),
		BUN: (path) => Bun.file(path)
			.exists()
			.then(
				(value) => value
					? EE.ok()
					: EE.left("file-system-exists", new Error("Path does not exist")),
			)
			.catch((value) => EE.left("file-system-exists", value)),
	},
);
