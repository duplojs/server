import * as EE from "@duplojs/utils/either";
import * as DD from "@duplojs/utils/date";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

interface SetTimeParams {
	accessTime: DD.TheDate;
	modifiedTime: DD.TheDate;
}

declare module "@scripts/implementor" {
	interface ServerUtilsFunction {
		setTime(
			path: string,
			params: SetTimeParams
		): Promise<FileSystemLeft<"set-time"> | EE.Ok>;
	}
}

/**
 * {@include file/setTime/index.md}
 */
export const setTime = implementFunction(
	"setTime",
	{
		NODE: async(path, { accessTime, modifiedTime }) => {
			const fs = await nodeFileSystem.value;
			return fs.utimes(
				path,
				DD.toTimestamp(accessTime),
				DD.toTimestamp(modifiedTime),
			)
				.then(EE.ok)
				.catch((value) => EE.left("file-system-set-time", value));
		},
		DENO: (path, { accessTime, modifiedTime }) => Deno
			.utime(
				path,
				DD.toTimestamp(accessTime),
				DD.toTimestamp(modifiedTime),
			)
			.then(EE.ok)
			.catch((value) => EE.left("file-system-set-time", value)),
	},
);
