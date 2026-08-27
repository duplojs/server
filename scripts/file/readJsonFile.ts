import { type Json } from "@duplojs/lang";
import * as DEither from "@duplojs/lang/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerFunction {
		readJsonFile<
			GenericPath extends string,
		>(
			path: GenericPath,
		): Promise<FileSystemLeft<"read-json-file"> | DEither.Success<Json>>;
	}
}

export const readJsonFile = implementFunction(
	"readJsonFile",
	{
		NODE: async(path) => {
			const fs = await nodeFileSystem.value;
			return fs.readFile(path, { encoding: "utf-8" })
				.then(JSON.parse)
				.then(DEither.success)
				.catch((value) => DEither.left("file-system-read-json-file", value));
		},

		DENO: (path) => Deno.readTextFile(path)
			.then(JSON.parse)
			.then(DEither.success)
			.catch((value) => DEither.left("file-system-read-json-file", value)),

		BUN: (path) => Bun.file(path)
			.text()
			.then(JSON.parse)
			.then(DEither.success)
			.catch((value) => DEither.left("file-system-read-json-file", value)),
	},
);
