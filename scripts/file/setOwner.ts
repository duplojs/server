import * as EE from "@duplojs/lang/either";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

interface SetOwnerParams {
	userId: number;
	groupId: number;
}

declare module "@scripts/implementor" {
	interface ServerFunction {
		setOwner(
			path: string,
			params: SetOwnerParams,
		): Promise<FileSystemLeft<"set-owner"> | EE.Ok>;
	}
}

export const setOwner = implementFunction(
	"setOwner",
	{
		NODE: async(path, { userId, groupId }) => {
			const fs = await nodeFileSystem.value;
			return fs.chown(path, userId, groupId)
				.then(EE.ok)
				.catch((value) => EE.left("file-system-set-owner", value));
		},
		DENO: (path, { userId, groupId }) => Deno
			.chown(path, userId, groupId)
			.then(EE.ok)
			.catch((value) => EE.left("file-system-set-owner", value)),
	},
);
