import type * as DPath from "@duplojs/lang/path";
import * as DEither from "@duplojs/lang/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

interface ReadDirectoryParams {
	recursive?: boolean;
}

declare module "@scripts/implementor" {
	interface ServerFunction {
		readDirectory<
			GenericPath extends string & DPath.Path,
		>(
			path: GenericPath,
			params?: ReadDirectoryParams,
		): Promise<FileSystemLeft<"read-directory"> | DEither.Success<(string & DPath.Path)[]>>;
	}
}

export const readDirectory = implementFunction(
	"readDirectory",
	{
		NODE: async(path, params) => {
			const fs = await nodeFileSystem.value;

			return fs.readdir(path, { recursive: params?.recursive })
				.then(DEither.success)
				.catch((value) => DEither.left("file-system-read-directory", value)) as never;
		},
	},
);
