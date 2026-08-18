import * as EE from "@duplojs/utils/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerUtilsFunction {
		appendFile(
			path: string,
			data: Uint8Array,
		): Promise<FileSystemLeft<"append-file"> | EE.Ok>;
	}
}

/**
 * {@include file/appendFile/index.md}
 */
export const appendFile = implementFunction(
	"appendFile",
	{
		NODE: async(path, data) => {
			const fs = await nodeFileSystem.value;
			return fs.appendFile(
				path,
				data,
			)
				.then(EE.ok)
				.catch((value) => EE.left("file-system-append-file", value));
		},
		DENO: (path, data) => Deno.writeFile(
			path,
			data,
			{ append: true },
		)
			.then(EE.ok)
			.catch((value) => EE.left("file-system-append-file", value)),
	},
);
