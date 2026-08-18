import * as EE from "@duplojs/utils/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerUtilsFunction {
		readLink<
			GenericPath extends string,
		>(
			path: GenericPath
		): Promise<FileSystemLeft<"read-link"> | EE.Success<string>>;
	}
}

/**
 * {@include file/readLink/index.md}
 */
export const readLink = implementFunction(
	"readLink",
	{
		NODE: async(path) => {
			const fs = await nodeFileSystem.value;
			return fs.readlink(
				path,
				{ encoding: "utf-8" },
			)
				.then(EE.success)
				.catch((value) => EE.left("file-system-read-link", value));
		},
		DENO: (path) => Deno
			.readLink(path)
			.then(EE.success)
			.catch((value) => EE.left("file-system-read-link", value)),
	},
);
