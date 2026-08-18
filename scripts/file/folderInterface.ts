import { asyncPipe, innerPipe, Path, type Kind } from "@duplojs/utils";
import * as EE from "@duplojs/utils/either";
import { createDuplojsServerUtilsKind } from "@scripts/kind";
import { move } from "./move";
import { exists } from "./exists";
import { rename } from "./rename";
import { remove } from "./remove";
import { readDirectory } from "./readDirectory";
import { stat, type StatInfo } from "./stat";
import { walkDirectory } from "./walkDirectory";
import type { FileInterface } from "./fileInterface";
import type { UnknownInterface } from "./unknownInterface";
import type { FileSystemLeft } from "./types";
import { relocate } from "./relocate";

const folderInterfaceKind = createDuplojsServerUtilsKind("folderInterface");

export interface FolderInterface extends Kind<
	typeof folderInterfaceKind.definition
> {
	path: string;
	getName(): string | null;
	getParentPath(): string | null;
	rename(newName: string): Promise<FileSystemLeft<"rename"> | EE.Success<FolderInterface>>;
	exists(): Promise<FileSystemLeft<"exists"> | EE.Ok>;
	relocate(parentPath: string): Promise<FileSystemLeft<"relocate"> | EE.Success<FolderInterface>>;
	move(newPath: string): Promise<FileSystemLeft<"move"> | EE.Success<FolderInterface>>;
	remove(): Promise<FileSystemLeft<"remove"> | EE.Ok>;
	getChildren(): Promise<FileSystemLeft<"read-directory"> | EE.Success<string[]>>;
	stat(): Promise<FileSystemLeft<"stat"> | EE.Success<StatInfo>>;
	walk(): Promise<FileSystemLeft<"walk-directory"> | EE.Success<Generator<FolderInterface | FileInterface | UnknownInterface>>>;
}

/**
 * {@include file/createFolderInterface/index.md}
 */
export function createFolderInterface(path: string): FolderInterface {
	function getName() {
		return Path.getBaseName(path);
	}

	function getParentPath() {
		return Path.getParentFolderPath(path);
	}

	function localRename(newName: string) {
		return asyncPipe(
			rename(path, newName),
			EE.whenIsRight(
				innerPipe(
					createFolderInterface,
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
					createFolderInterface,
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
					createFolderInterface(newPath),
				),
			),
		);
	}

	function localExists() {
		return exists(path);
	}

	function localRemove() {
		return remove(path);
	}

	function localStat() {
		return stat(path);
	}

	function getChildren() {
		return readDirectory(path);
	}

	function walk() {
		return walkDirectory(path);
	}

	return folderInterfaceKind.addTo({
		path,
		getName,
		getParentPath,
		move: localMove,
		rename: localRename,
		exists: localExists,
		relocate: localRelocate,
		remove: localRemove,
		getChildren,
		stat: localStat,
		walk,
	});
}

/**
 * {@include file/isFolderInterface/index.md}
 */
export function isFolderInterface(
	input: unknown,
): input is FolderInterface {
	return folderInterfaceKind.has(input);
}
