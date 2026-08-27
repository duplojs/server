import * as DPath from "@duplojs/lang/path";
import * as DEither from "@duplojs/lang/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerFunction {
		relocate(
			fromPath: string & DPath.Path,
			toPath: string & DPath.Path,
		): Promise<FileSystemLeft<"relocate"> | DEither.Success<string & DPath.Path>>;
	}
}

export const relocate = implementFunction(
	"relocate",
	{
		NODE: async(fromPath, newParentPath) => {
			const fs = await nodeFileSystem.value;
			const baseName = DPath.getBaseName(fromPath);

			if (!baseName) {
				return DEither.left("file-system-relocate", new Error(`Invalid base name ${fromPath}`));
			}

			const newPath = DPath.resolveRelative([newParentPath, baseName]);

			return fs.rename(
				fromPath,
				newPath,
			)
				.then(() => DEither.success(newPath))
				.catch((value) => DEither.left("file-system-relocate", value));
		},
		DENO: (fromPath, newParentPath) => {
			const baseName = DPath.getBaseName(fromPath);

			if (!baseName) {
				return Promise.resolve(DEither.left("file-system-relocate", new Error(`Invalid base name ${fromPath}`)));
			}

			const newPath = DPath.resolveRelative([newParentPath, baseName]);

			return Deno.rename(
				fromPath,
				newPath,
			)
				.then(() => DEither.success(newPath))
				.catch((value) => DEither.left("file-system-relocate", value));
		},
	},
);
