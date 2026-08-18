import * as EE from "@duplojs/utils/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerUtilsFunction {
		realPath<
			GenericPath extends string,
		>(
			path: GenericPath,
		): Promise<FileSystemLeft<"real-path"> | EE.Success<string>>;
	}
}

/**
 * {@include file/realPath/index.md}
 */
export const realPath = implementFunction(
	"realPath",
	{
		NODE: async(path) => {
			const fs = await nodeFileSystem.value;
			return fs.realpath(path)
				.then(EE.success)
				.catch((value) => EE.left("file-system-real-path", value));
		},
		DENO: (path) => Deno
			.realPath(path)
			.then(EE.success)
			.catch((value) => EE.left("file-system-real-path", value)),
	},
);
