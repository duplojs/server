import { innerPipe } from "@duplojs/lang";
import * as GG from "@duplojs/lang/generator";
import * as EE from "@duplojs/lang/either";
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
			GenericPath extends string,
		>(
			path: GenericPath,
			params?: WalkDirectoryParams,
		): Promise<
			FileSystemLeft<"walk-directory">
			| EE.Success<
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
										`${parentPath}/${name}`,
									),
								),
								PP.when(
									(dirent) => dirent.isDirectory(),
									({ parentPath, name }) => createFolderInterface(
										`${parentPath}/${name}`,
									),
								),
								PP.otherwise(
									({ parentPath, name }) => createUnknownInterface(
										`${parentPath}/${name}`,
									),
								),
							),
						),
						EE.success,
					),
				)
				.catch((value) => EE.left("file-system-walk-directory", value));
		},
	},
);

