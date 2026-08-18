import { Path, type Kind } from "@duplojs/utils";
import type * as EE from "@duplojs/utils/either";
import { createDuplojsServerUtilsKind } from "@scripts/kind";
import { stat, type StatInfo } from "./stat";
import { exists } from "./exists";
import type { FileSystemLeft } from "./types";

const unknownInterfaceKind = createDuplojsServerUtilsKind("unknownInterface");

export interface UnknownInterface extends Kind<
	typeof unknownInterfaceKind.definition
> {
	path: string;
	getName(): string | null;
	getParentPath(): string | null;
	stat(): Promise<FileSystemLeft<"stat"> | EE.Success<StatInfo>>;
	exist(): Promise<FileSystemLeft<"exists"> | EE.Ok>;
}

/**
 * {@include file/createUnknownInterface/index.md}
 */
export function createUnknownInterface(path: string): UnknownInterface {
	function getName() {
		return Path.getBaseName(path);
	}

	function getParentPath() {
		return Path.getParentFolderPath(path);
	}

	function localStat() {
		return stat(path);
	}

	function exist() {
		return exists(path);
	}

	return unknownInterfaceKind.addTo({
		path,
		getName,
		getParentPath,
		stat: localStat,
		exist,
	});
}

/**
 * {@include file/isUnknownInterface/index.md}
 */
export function isUnknownInterface(
	input: unknown,
): input is UnknownInterface {
	return unknownInterfaceKind.has(input);
}
