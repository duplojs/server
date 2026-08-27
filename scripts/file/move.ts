import type * as DPath from "@duplojs/lang/path";
import * as DEither from "@duplojs/lang/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerFunction {
		move(
			fromPath: string & DPath.Path,
			toPath: string & DPath.Path,
		): Promise<FileSystemLeft<"move"> | DEither.Ok>;
	}
}

export const move = implementFunction(
	"move",
	{
		NODE: async(fromPath, toPath) => {
			const fs = await nodeFileSystem.value;
			return fs.rename(
				fromPath,
				toPath,
			)
				.then(DEither.ok)
				.catch((value) => DEither.left("file-system-move", value));
		},
		DENO: (fromPath, toPath) => Deno.rename(
			fromPath,
			toPath,
		)
			.then(DEither.ok)
			.catch((value) => DEither.left("file-system-move", value)),
	},
);
