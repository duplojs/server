import * as EE from "@duplojs/utils/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerUtilsFunction {
		makeTemporaryDirectory(prefix: string): Promise<FileSystemLeft<"make-temporary-directory"> | EE.Success<string>>;
	}
}

/**
 * {@include file/makeTemporaryDirectory/index.md}
 */
export const makeTemporaryDirectory = implementFunction(
	"makeTemporaryDirectory",
	{
		NODE: async(prefix) => {
			const fs = await nodeFileSystem.value;
			return fs.mkdtemp(prefix)
				.then(EE.success)
				.catch((value) => EE.left("file-system-make-temporary-directory", value));
		},
		DENO: (prefix) => Deno.makeTempDir({ prefix })
			.then(EE.success)
			.catch((value) => EE.left("file-system-make-temporary-directory", value)),
	},
);
