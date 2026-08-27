import * as DEither from "@duplojs/lang/either";
import type * as DPath from "@duplojs/lang/path";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

interface SetOwnerParams {
	userId: number;
	groupId: number;
}

declare module "@scripts/implementor" {
	interface ServerFunction {
		setOwner(
			path: string & DPath.Path,
			params: SetOwnerParams,
		): Promise<FileSystemLeft<"set-owner"> | DEither.Ok>;
	}
}

export const setOwner = implementFunction(
	"setOwner",
	{
		NODE: async(path, { userId, groupId }) => {
			const fs = await nodeFileSystem.value;
			return fs.chown(path, userId, groupId)
				.then(DEither.ok)
				.catch((value) => DEither.left("file-system-set-owner", value));
		},
		DENO: (path, { userId, groupId }) => Deno
			.chown(path, userId, groupId)
			.then(DEither.ok)
			.catch((value) => DEither.left("file-system-set-owner", value)),
	},
);
