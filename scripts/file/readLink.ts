import * as DEither from "@duplojs/lang/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerFunction {
		readLink<
			GenericPath extends string,
		>(
			path: GenericPath
		): Promise<FileSystemLeft<"read-link"> | DEither.Success<string>>;
	}
}

export const readLink = implementFunction(
	"readLink",
	{
		NODE: async(path) => {
			const fs = await nodeFileSystem.value;
			return fs.readlink(
				path,
				{ encoding: "utf-8" },
			)
				.then(DEither.success)
				.catch((value) => DEither.left("file-system-read-link", value));
		},
		DENO: (path) => Deno
			.readLink(path)
			.then(DEither.success)
			.catch((value) => DEither.left("file-system-read-link", value)),
	},
);
