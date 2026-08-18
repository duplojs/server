import * as EE from "@duplojs/lang/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerFunction {
		appendTextFile(
			path: string,
			data: string,
		): Promise<FileSystemLeft<"append-text-file"> | EE.Ok>;
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
				.then(EE.ok)
				.catch((value) => EE.left("file-system-append-text-file", value));
		},
		DENO: (path, data) => Deno.writeTextFile(
			path,
			data,
			{ append: true },
		)
			.then(EE.ok)
			.catch((value) => EE.left("file-system-append-text-file", value)),
	},
);
