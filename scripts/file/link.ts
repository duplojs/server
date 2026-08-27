import * as DEither from "@duplojs/lang/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerFunction {
		link(
			existingPath: string,
			newPath: string,
		): Promise<FileSystemLeft<"link"> | DEither.Ok>;
	}
}

export const link = implementFunction(
	"link",
	{
		NODE: async(existingPath, newPath) => {
			const fs = await nodeFileSystem.value;
			return fs.link(
				existingPath,
				newPath,
			)
				.then(DEither.ok)
				.catch((value) => DEither.left("file-system-link", value));
		},
		DENO: (existingPath, newPath) => Deno
			.link(
				existingPath,
				newPath,
			)
			.then(DEither.ok)
			.catch((value) => DEither.left("file-system-link", value)),
	},
);
