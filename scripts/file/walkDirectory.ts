import { forwardAsserts, innerPipe } from "@duplojs/lang";
import * as DPath from "@duplojs/lang/path";
import * as GG from "@duplojs/lang/generator";
import * as DEither from "@duplojs/lang/either";
import * as PP from "@duplojs/lang/pattern";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import { type FileInterface, createFileInterface } from "./fileInterface";
import { type FolderInterface, createFolderInterface } from "./folderInterface";
import { createUnknownInterface, type UnknownInterface } from "./unknownInterface";
import type { FileSystemLeft } from "./types";

interface WalkDirectoryParams {
	recursive?: boolean;
}

declare module "@scripts/implementor" {
	interface ServerFunction {
		walkDirectory<
			GenericPath extends string & DPath.Path,
		>(
			path: GenericPath,
			params?: WalkDirectoryParams,
		): Promise<
			FileSystemLeft<"walk-directory">
			| DEither.Success<
				Generator<FileInterface | FolderInterface | UnknownInterface>
			>
		>;
	}
}

export const walkDirectory = implementFunction(
	"walkDirectory",
	{
		NODE: async(path, params) => {
			const fs = await nodeFileSystem.value;

			return fs.readdir(
				path,
				{
					recursive: params?.recursive ?? false,
					withFileTypes: true,
				},
			)
				.then(
					innerPipe(
						GG.map(
							innerPipe(
								PP.when(
									(dirent) => dirent.isFile(),
									({ parentPath, name }) => createFileInterface(
										forwardAsserts(`${parentPath}/${name}`, DPath.is),
									),
								),
								PP.when(
									(dirent) => dirent.isDirectory(),
									({ parentPath, name }) => createFolderInterface(
										forwardAsserts(`${parentPath}/${name}`, DPath.is),
									),
								),
								PP.otherwise(
									({ parentPath, name }) => createUnknownInterface(
										forwardAsserts(`${parentPath}/${name}`, DPath.is),
									),
								),
							),
						),
						DEither.success,
					),
				)
				.catch((value) => DEither.left("file-system-walk-directory", value));
		},
	},
);
