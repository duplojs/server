import { instanceOf, pipe, when } from "@duplojs/lang";
import * as DEither from "@duplojs/lang/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerFunction {
		truncate<
			GenericPath extends string,
		>(
			path: GenericPath,
			size?: number,
		): Promise<FileSystemLeft<"truncate"> | DEither.Ok>;
	}
}

export const truncate = implementFunction(
	"truncate",
	{
		NODE: async(path, size) => {
			const fs = await nodeFileSystem.value;
			return fs.truncate(path, size)
				.then(DEither.ok)
				.catch((value) => DEither.left("file-system-truncate", value));
		},
		DENO: (path: string, size) => pipe(
			path,
			when(
				instanceOf(URL),
				({ pathname }) => decodeURIComponent(pathname),
			),
			(stringPath) => Deno
				.truncate(stringPath, size)
				.then(DEither.ok)
				.catch((value) => DEither.left("file-system-truncate", value)),
		),
	},
);
