import * as DPath from "@duplojs/lang/path";
import * as DEither from "@duplojs/lang/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerFunction {
		rename(
			path: string & DPath.Path,
			newName: string & DPath.Segment,
		): Promise<FileSystemLeft<"rename"> | DEither.Success<string & DPath.Path>>;
	}
}

export const rename = implementFunction(
	"rename",
	{
		NODE: async(path, newName) => {
			const fs = await nodeFileSystem.value;

			const parentPath = DPath.getParentFolderPath(path);

			if (!parentPath) {
				return DEither.left("file-system-rename", new Error(`Invalid parent path ${path}.`));
			}

			const newPath = DPath.resolveRelative([parentPath, newName]);

			return fs.rename(
				path,
				newPath,
			)
				.then(() => DEither.success(newPath))
				.catch((value) => DEither.left("file-system-rename", value));
		},
		DENO: (path, newName) => {
			const parentPath = DPath.getParentFolderPath(path);

			if (!parentPath) {
				return Promise.resolve(DEither.left("file-system-rename", new Error(`Invalid parent path ${path}.`)));
			}

			const newPath = DPath.resolveRelative([parentPath, newName]);

			return Deno.rename(
				path,
				newPath,
			)
				.then(() => DEither.success(newPath))
				.catch((value) => DEither.left("file-system-rename", value));
		},
	},
);
