import * as EE from "@duplojs/lang/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

export interface SymlinkParams {

	/**
	 * @remarks
	 * Specify the symbolic link type as file, directory or NTFS junction.
	 * This option only applies to Windows and is ignored on other operating systems.
	 */
	type: "file" | "dir" | "junction";
}

declare module "@scripts/implementor" {
	interface ServerFunction {
		symlink(
			oldPath: string,
			newPath: string,
			params?: SymlinkParams
		): Promise<FileSystemLeft<"symlink"> | EE.Ok>;
	}
}

export const symlink = implementFunction(
	"symlink",
	{
		NODE: async(oldPath, newPath, params) => {
			const fs = await nodeFileSystem.value;
			return fs.symlink(
				oldPath,
				newPath,
				params?.type,
			)
				.then(EE.ok)
				.catch((value) => EE.left("file-system-symlink", value));
		},
		DENO: (oldPath, newPath, params) => Deno
			.symlink(
				oldPath,
				newPath,
				params,
			)
			.then(EE.ok)
			.catch((value) => EE.left("file-system-symlink", value)),
	},
);
