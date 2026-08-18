import { asyncPipe, type Kind, mimeType, Path, innerPipe } from "@duplojs/utils";
import * as EE from "@duplojs/utils/either";
import { createDuplojsServerUtilsKind } from "@scripts/kind";
import { rename } from "./rename";
import { exists } from "./exists";
import { move } from "./move";
import { remove } from "./remove";
import { type StatInfo, stat } from "./stat";
import type { FileSystemLeft } from "./types";
import { relocate } from "./relocate";

const fileInterfaceKind = createDuplojsServerUtilsKind("fileInterface");

export interface FileInterface extends Kind<
	typeof fileInterfaceKind.definition
> {
	path: string;
	getName(): string | null;
	getMimeType(): string | null;
	getExtension(params?: Path.GetExtensionNameParams): string | null;
	getParentPath(): string | null;
	rename(newName: string): Promise<FileSystemLeft<"rename"> | EE.Success<FileInterface>>;
	relocate(parentPath: string): Promise<FileSystemLeft<"relocate"> | EE.Success<FileInterface>>;
	move(newPath: string): Promise<FileSystemLeft<"move"> | EE.Success<FileInterface>>;
	exists(): Promise<FileSystemLeft<"exists"> | EE.Ok>;
	remove(): Promise<FileSystemLeft<"remove"> | EE.Ok>;
	stat(): Promise<FileSystemLeft<"stat"> | EE.Success<StatInfo>>;
}

/**
 * {@include file/createFileInterface/index.md}
 */
export function createFileInterface(
	path: string,
): FileInterface {
	function getName() {
		return Path.getBaseName(path);
	}

	function getExtension(params?: Path.GetExtensionNameParams) {
		return Path.getExtensionName(path, params);
	}

	function getMimeType() {
		const extension = getExtension();

		if (!extension) {
			return null;
		}

		return mimeType.get(extension) ?? null;
	}

	function getParentPath() {
		return Path.getParentFolderPath(path);
	}

	function localExists() {
		return exists(path);
	}

	function localRename(newName: string) {
		return asyncPipe(
			rename(path, newName),
			EE.whenIsRight(
				innerPipe(
					createFileInterface,
					EE.success,
				),
			),
		);
	}

	function localRelocate(newParentPath: string) {
		return asyncPipe(
			relocate(path, newParentPath),
			EE.whenIsRight(
				innerPipe(
					createFileInterface,
					EE.success,
				),
			),
		);
	}

	function localMove(newPath: string) {
		return asyncPipe(
			move(path, newPath),
			EE.whenIsRight(
				() => EE.success(
					createFileInterface(newPath),
				),
			),
		);
	}

	function localRemove() {
		return remove(path);
	}

	function localStat() {
		return stat(path);
	}

	return fileInterfaceKind.addTo({
		path,
		getName,
		getExtension,
		getMimeType,
		getParentPath,
		rename: localRename,
		exists: localExists,
		relocate: localRelocate,
		remove: localRemove,
		move: localMove,
		stat: localStat,
	});
}

/**
 * {@include file/isFileInterface/index.md}
 */
export function isFileInterface(
	input: unknown,
): input is FileInterface {
	return fileInterfaceKind.has(input);
}
