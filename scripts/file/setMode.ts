import { isType } from "@duplojs/lang";
import * as DEither from "@duplojs/lang/either";
import type * as DPath from "@duplojs/lang/path";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

interface Permissions {
	read?: boolean;
	write?: boolean;
	exec?: boolean;
}

interface ModeObject {
	user?: Permissions;
	group?: Permissions;
	other?: Permissions;

	setUserId?: boolean;
	setGroupId?: boolean;
	sticky?: boolean;
}

type SetMode = ModeObject | number;

function calculatePermissions(permissions?: Permissions): number {
	if (!permissions) {
		return 0;
	}

	return (permissions.read ? 4 : 0)
       + (permissions.write ? 2 : 0)
       + (permissions.exec ? 1 : 0);
}

function toMode(mode: SetMode): number {
	if (isType(mode, "number")) {
		return mode;
	}

	const special = (mode.setUserId ? 4 : 0)
                + (mode.setGroupId ? 2 : 0)
                + (mode.sticky ? 1 : 0);

	const user = calculatePermissions(mode.user);
	const group = calculatePermissions(mode.group);
	const other = calculatePermissions(mode.other);

	return (special * 512) + (user * 64) + (group * 8) + other;
}

declare module "@scripts/implementor" {
	interface ServerFunction {
		setMode(
			path: string & DPath.Path,
			mode: SetMode,
		): Promise<FileSystemLeft<"set-mode"> | DEither.Ok>;
	}
}

export const setMode = implementFunction(
	"setMode",
	{
		NODE: async(path, mode) => {
			const fs = await nodeFileSystem.value;
			return fs.chmod(path, toMode(mode))
				.then(DEither.ok)
				.catch((value) => DEither.left("file-system-set-mode", value));
		},
		DENO: (path, mode) => Deno
			.chmod(path, toMode(mode))
			.then(DEither.ok)
			.catch((value) => DEither.left("file-system-set-mode", value)),
	},
);
