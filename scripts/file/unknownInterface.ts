import type * as DKind from "@duplojs/lang/kind";
import * as DPath from "@duplojs/lang/path";
import type * as DEither from "@duplojs/lang/either";
import { createKind } from "@scripts/kind";
import { stat, type StatInfo } from "./stat";
import { exists } from "./exists";
import type { FileSystemLeft } from "./types";

const unknownInterfaceKind = createKind("unknownInterface");

export interface UnknownInterface extends DKind.Kind<
	typeof unknownInterfaceKind
> {
	path: string & DPath.Path;
	getName(): (string & DPath.Segment) | null;
	getParentPath(): (string & DPath.Path) | null;
	stat(): Promise<FileSystemLeft<"stat"> | DEither.Success<StatInfo>>;
	exist(): Promise<FileSystemLeft<"exists"> | DEither.Ok>;
}

export function createUnknownInterface(path: string & DPath.Path): UnknownInterface {
	function getName() {
		return DPath.getBaseName(path);
	}

	function getParentPath() {
		return DPath.getParentFolderPath(path);
	}

	function localStat() {
		return stat(path);
	}

	function exist() {
		return exists(path);
	}

	return {
		path,
		getName,
		getParentPath,
		stat: localStat,
		exist,
		[unknownInterfaceKind.runTimeKey]: null,
	} satisfies DKind.Remove<UnknownInterface> as never;
}

export function isUnknownInterface(
	input: unknown,
): input is UnknownInterface {
	return unknownInterfaceKind.has(input);
}
