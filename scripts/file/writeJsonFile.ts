import { pipe } from "@duplojs/lang";
import * as DEither from "@duplojs/lang/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

interface WriteJsonFile {
	space?: number;
}

declare module "@scripts/implementor" {
	interface ServerFunction {
		writeJsonFile(
			path: string,
			data: unknown,
			params?: WriteJsonFile
		): Promise<FileSystemLeft<"write-json-file"> | DEither.Ok>;
	}
}

export const writeJsonFile = implementFunction(
	"writeJsonFile",
	{
		NODE: async(path, data, params) => {
			const fs = await nodeFileSystem.value;
			return pipe(
				DEither.safeCallback(
					() => JSON.stringify(
						data,
						null,
						params?.space,
					),
				),
				DEither.matchInformation({
					"safe-callback-error": (value) => DEither.left("file-system-write-json-file", value),
					"safe-callback-success": (value) => fs
						.writeFile(
							path,
							value,
							{ encoding: "utf-8" },
						)
						.then(DEither.ok)
						.catch((value) => DEither.left("file-system-write-json-file", value)),
				}),
			);
		},
		DENO: async(path, data, params) => pipe(
			DEither.safeCallback(
				() => JSON.stringify(
					data,
					null,
					params?.space,
				),
			),
			DEither.matchInformation({
				"safe-callback-error": (value) => DEither.left("file-system-write-json-file", value),
				"safe-callback-success": (value) => Deno
					.writeTextFile(
						path,
						value,
					)
					.then(DEither.ok)
					.catch((value) => DEither.left("file-system-write-json-file", value)),
			}),
		),
		BUN: async(path, data, params) => pipe(
			DEither.safeCallback(
				() => JSON.stringify(
					data,
					null,
					params?.space,
				),
			),
			DEither.matchInformation({
				"safe-callback-error": (value) => DEither.left("file-system-write-json-file", value),
				"safe-callback-success": (value) => Bun.file(path)
					.write(value)
					.then(DEither.ok)
					.catch((value) => DEither.left("file-system-write-json-file", value)),
			}),
		),
	},
);
