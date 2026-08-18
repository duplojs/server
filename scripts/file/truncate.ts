import { instanceOf, pipe, when } from "@duplojs/utils";
import * as EE from "@duplojs/utils/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerUtilsFunction {
		truncate<
			GenericPath extends string,
		>(
			path: GenericPath,
			size?: number,
		): Promise<FileSystemLeft<"truncate"> | EE.Ok>;
	}
}

/**
 * {@include file/truncate/index.md}
 */
export const truncate = implementFunction(
	"truncate",
	{
		NODE: async(path, size) => {
			const fs = await nodeFileSystem.value;
			return fs.truncate(path, size)
				.then(EE.ok)
				.catch((value) => EE.left("file-system-truncate", value));
		},
		DENO: (path: string, size) => pipe(
			path,
			when(
				instanceOf(URL),
				({ pathname }) => decodeURIComponent(pathname),
			),
			(stringPath) => Deno
				.truncate(stringPath, size)
				.then(EE.ok)
				.catch((value) => EE.left("file-system-truncate", value)),
		),
	},
);
