import * as DEither from "@duplojs/lang/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerFunction {
		copy(
			fromPath: string,
			toPath: string,
		): Promise<FileSystemLeft<"copy"> | DEither.Ok>;
	}
}

export const copy = implementFunction(
	"copy",
	{
		NODE: async(fromPath, toPath) => {
			const fs = await nodeFileSystem.value;
			return fs.cp(
				fromPath,
				toPath,
				{ recursive: true },
			)
				.then(DEither.ok)
				.catch((value) => DEither.left("file-system-copy", value));
		},
	},
);
