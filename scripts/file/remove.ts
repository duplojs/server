import * as DEither from "@duplojs/lang/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

interface RemoveDirectoryParams {
	recursive?: boolean;
}

declare module "@scripts/implementor" {
	interface ServerFunction {
		remove<
			GenericPath extends string,
		>(
			path: GenericPath,
			params?: RemoveDirectoryParams
		): Promise<FileSystemLeft<"remove"> | DEither.Ok>;
	}
}

export const remove = implementFunction(
	"remove",
	{
		NODE: async(path, params) => {
			const fs = await nodeFileSystem.value;
			return fs.rm(
				path,
				{
					recursive: params?.recursive ?? false,
					force: true,
				},
			)
				.then(DEither.ok)
				.catch((value) => DEither.left("file-system-remove", value));
		},
		DENO: (path, params) => Deno.remove(
			path,
			{
				recursive: params?.recursive,
			},
		)
			.then(DEither.ok)
			.catch((value) => DEither.left("file-system-remove", value)),
	},
);
