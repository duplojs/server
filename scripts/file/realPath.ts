import * as DEither from "@duplojs/lang/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerFunction {
		realPath<
			GenericPath extends string,
		>(
			path: GenericPath,
		): Promise<FileSystemLeft<"real-path"> | DEither.Success<string>>;
	}
}

export const realPath = implementFunction(
	"realPath",
	{
		NODE: async(path) => {
			const fs = await nodeFileSystem.value;
			return fs.realpath(path)
				.then(DEither.success)
				.catch((value) => DEither.left("file-system-real-path", value));
		},
		DENO: (path) => Deno
			.realPath(path)
			.then(DEither.success)
			.catch((value) => DEither.left("file-system-real-path", value)),
	},
);
