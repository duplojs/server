import { Path } from "@duplojs/utils";
import * as EE from "@duplojs/utils/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerUtilsFunction {
		rename(
			path: string,
			newName: string,
		): Promise<FileSystemLeft<"rename"> | EE.Success<string>>;
	}
}

/**
 * {@include file/rename/index.md}
 */
export const rename = implementFunction(
	"rename",
	{
		NODE: async(path, newName) => {
			const fs = await nodeFileSystem.value;

			const parentPath = Path.getParentFolderPath(path);

			if (!parentPath) {
				return EE.left("file-system-rename", new Error(`Invalid parent path ${parentPath}.`));
			}

			if (newName.includes("/")) {
				return EE.left("file-system-rename", new Error(`Invalid new name ${newName}.`));
			}

			const newPath = Path.resolveRelative([parentPath, newName]);

			return fs.rename(
				path,
				newPath,
			)
				.then(() => EE.success(newPath))
				.catch((value) => EE.left("file-system-rename", value));
		},
		DENO: (path, newName) => {
			const parentPath = Path.getParentFolderPath(path);

			if (!parentPath) {
				return Promise.resolve(EE.left("file-system-rename", new Error(`Invalid parent path ${parentPath}.`)));
			}

			if (newName.includes("/")) {
				return Promise.resolve(EE.left("file-system-rename", new Error(`Invalid new name ${newName}.`)));
			}

			const newPath = Path.resolveRelative([parentPath, newName]);

			return Deno.rename(
				path,
				newPath,
			)
				.then(() => EE.success(newPath))
				.catch((value) => EE.left("file-system-rename", value));
		},
	},
);
