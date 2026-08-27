import * as DEither from "@duplojs/lang/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerFunction {
		ensureDirectory<
			GenericPath extends string,
		>(
			path: GenericPath,
		): Promise<FileSystemLeft<"ensure-directory"> | DEither.Ok>;
	}
}

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
				.then(DEither.ok)
				.catch((value) => DEither.left("file-system-ensure-directory", value));
		},
		DENO: (path) => Deno.mkdir(
			path,
			{
				recursive: true,
			},
		)
			.then(DEither.ok)
			.catch((value) => DEither.left("file-system-ensure-directory", value)),
	},
);
