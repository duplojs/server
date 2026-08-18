import * as EE from "@duplojs/utils/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

interface ReadDirectoryParams {
	recursive?: boolean;
}

declare module "@scripts/implementor" {
	interface ServerUtilsFunction {
		readDirectory<
			GenericPath extends string,
		>(
			path: GenericPath,
			params?: ReadDirectoryParams,
		): Promise<FileSystemLeft<"read-directory"> | EE.Success<string[]>>;
	}
}

/**
 * {@include file/readDirectory/index.md}
 */
export const readDirectory = implementFunction(
	"readDirectory",
	{
		NODE: async(path, params) => {
			const fs = await nodeFileSystem.value;

			return fs.readdir(path, { recursive: params?.recursive })
				.then(EE.success)
				.catch((value) => EE.left("file-system-read-directory", value));
		},
	},
);
