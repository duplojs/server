import * as DEither from "@duplojs/lang/either";
import type * as DPath from "@duplojs/lang/path";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

interface MakeDirectoryParams {
	recursive?: boolean;
}

declare module "@scripts/implementor" {
	interface ServerFunction {
		makeDirectory<
			GenericPath extends string & DPath.Path,
		>(
			path: GenericPath,
			params?: MakeDirectoryParams
		): Promise<FileSystemLeft<"make-directory"> | DEither.Ok>;
	}
}

export const makeDirectory = implementFunction(
	"makeDirectory",
	{
		NODE: async(path, params) => {
			const fs = await nodeFileSystem.value;
			return fs.mkdir(
				path,
				{
					recursive: params?.recursive,
				},
			)
				.then(DEither.ok)
				.catch((value) => DEither.left("file-system-make-directory", value));
		},
		DENO: (path, params) => Deno.mkdir(
			path,
			{
				recursive: params?.recursive,
			},
		)
			.then(DEither.ok)
			.catch((value) => DEither.left("file-system-make-directory", value)),
	},
);
