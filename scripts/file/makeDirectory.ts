import * as EE from "@duplojs/lang/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

interface MakeDirectoryParams {
	recursive?: boolean;
}

declare module "@scripts/implementor" {
	interface ServerFunction {
		makeDirectory<
			GenericPath extends string,
		>(
			path: GenericPath,
			params?: MakeDirectoryParams
		): Promise<FileSystemLeft<"make-directory"> | EE.Ok>;
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
				.then(EE.ok)
				.catch((value) => EE.left("file-system-make-directory", value));
		},
		DENO: (path, params) => Deno.mkdir(
			path,
			{
				recursive: params?.recursive,
			},
		)
			.then(EE.ok)
			.catch((value) => EE.left("file-system-make-directory", value)),
	},
);
