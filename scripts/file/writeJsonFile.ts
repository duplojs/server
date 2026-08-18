import { pipe } from "@duplojs/utils";
import * as EE from "@duplojs/utils/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

interface WriteJsonFile {
	space?: number;
}

declare module "@scripts/implementor" {
	interface ServerUtilsFunction {
		writeJsonFile(
			path: string,
			data: unknown,
			params?: WriteJsonFile
		): Promise<FileSystemLeft<"write-json-file"> | EE.Ok>;
	}
}

/**
 * {@include file/writeJsonFile/index.md}
 */
export const writeJsonFile = implementFunction(
	"writeJsonFile",
	{
		NODE: async(path, data, params) => {
			const fs = await nodeFileSystem.value;
			return pipe(
				EE.safeCallback(
					() => JSON.stringify(
						data,
						null,
						params?.space,
					),
				),
				EE.matchInformation({
					"safe-callback-error": (value) => EE.left("file-system-write-json-file", value),
					"safe-callback-success": (value) => fs
						.writeFile(
							path,
							value,
							{ encoding: "utf-8" },
						)
						.then(EE.ok)
						.catch((value) => EE.left("file-system-write-json-file", value)),
				}),
			);
		},
		DENO: async(path, data, params) => pipe(
			EE.safeCallback(
				() => JSON.stringify(
					data,
					null,
					params?.space,
				),
			),
			EE.matchInformation({
				"safe-callback-error": (value) => EE.left("file-system-write-json-file", value),
				"safe-callback-success": (value) => Deno
					.writeTextFile(
						path,
						value,
					)
					.then(EE.ok)
					.catch((value) => EE.left("file-system-write-json-file", value)),
			}),
		),
		BUN: async(path, data, params) => pipe(
			EE.safeCallback(
				() => JSON.stringify(
					data,
					null,
					params?.space,
				),
			),
			EE.matchInformation({
				"safe-callback-error": (value) => EE.left("file-system-write-json-file", value),
				"safe-callback-success": (value) => Bun.file(path)
					.write(value)
					.then(EE.ok)
					.catch((value) => EE.left("file-system-write-json-file", value)),
			}),
		),
	},
);
