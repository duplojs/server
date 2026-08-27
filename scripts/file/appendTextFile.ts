import * as DEither from "@duplojs/lang/either";
import type * as DPath from "@duplojs/lang/path";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerFunction {
		appendTextFile(
			path: string & DPath.Path,
			data: string,
		): Promise<FileSystemLeft<"append-text-file"> | DEither.Ok>;
	}
}

export const appendTextFile = implementFunction(
	"appendTextFile",
	{
		NODE: async(path, data) => {
			const fs = await nodeFileSystem.value;
			return fs.appendFile(
				path,
				data,
			)
				.then(DEither.ok)
				.catch((value) => DEither.left("file-system-append-text-file", value));
		},
		DENO: (path, data) => Deno.writeTextFile(
			path,
			data,
			{ append: true },
		)
			.then(DEither.ok)
			.catch((value) => DEither.left("file-system-append-text-file", value)),
	},
);
