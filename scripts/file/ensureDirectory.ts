import * as EE from "@duplojs/utils/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerUtilsFunction {
		ensureDirectory<
			GenericPath extends string,
		>(
			path: GenericPath,
		): Promise<FileSystemLeft<"ensure-directory"> | EE.Ok>;
	}
}

/**
 * {@include file/ensureDirectory/index.md}
 */
export const ensureDirectory = implementFunction(
	"ensureDirectory",
	{
		NODE: async(path) => {
			const fs = await nodeFileSystem.value;
			return fs.mkdir(
				path,
				{
					recursive: true,
				},
			)
				.then(EE.ok)
				.catch((value) => EE.left("file-system-ensure-directory", value));
		},
		DENO: (path) => Deno.mkdir(
			path,
			{
				recursive: true,
			},
		)
			.then(EE.ok)
			.catch((value) => EE.left("file-system-ensure-directory", value)),
	},
);
