import * as EE from "@duplojs/lang/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

interface ReadDirectoryParams {
	recursive?: boolean;
}

declare module "@scripts/implementor" {
	interface ServerFunction {
		readDirectory<
			GenericPath extends string,
		>(
			path: GenericPath,
			params?: ReadDirectoryParams,
		): Promise<FileSystemLeft<"read-directory"> | EE.Success<string[]>>;
	}
}

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
