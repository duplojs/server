import * as DEither from "@duplojs/lang/either";
import * as DChrono from "@duplojs/lang/chrono";
import type * as DPath from "@duplojs/lang/path";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

interface SetTimeParams {
	accessTime: DChrono.TheDate;
	modifiedTime: DChrono.TheDate;
}

declare module "@scripts/implementor" {
	interface ServerFunction {
		setTime(
			path: string & DPath.Path,
			params: SetTimeParams
		): Promise<FileSystemLeft<"set-time"> | DEither.Ok>;
	}
}

export const setTime = implementFunction(
	"setTime",
	{
		NODE: async(path, { accessTime, modifiedTime }) => {
			const fs = await nodeFileSystem.value;
			return fs.utimes(
				path,
				DChrono.toTimestamp(accessTime),
				DChrono.toTimestamp(modifiedTime),
			)
				.then(DEither.ok)
				.catch((value) => DEither.left("file-system-set-time", value));
		},
		DENO: (path, { accessTime, modifiedTime }) => Deno
			.utime(
				path,
				DChrono.toTimestamp(accessTime),
				DChrono.toTimestamp(modifiedTime),
			)
			.then(DEither.ok)
			.catch((value) => DEither.left("file-system-set-time", value)),
	},
);
