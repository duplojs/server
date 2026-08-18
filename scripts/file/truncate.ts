import { instanceOf, pipe, when } from "@duplojs/lang";
import * as EE from "@duplojs/lang/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerFunction {
		truncate<
			GenericPath extends string,
		>(
			path: GenericPath,
			size?: number,
		): Promise<FileSystemLeft<"truncate"> | EE.Ok>;
	}
}

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
