import { asyncPipe, innerPipe } from "@duplojs/lang";
import type * as DKind from "@duplojs/lang/kind";
import * as DPath from "@duplojs/lang/path";
import * as DEither from "@duplojs/lang/either";
import { createKind } from "@scripts/kind";
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

const folderInterfaceKind = createKind("folderInterface");

export interface FolderInterface extends DKind.Kind<
	typeof folderInterfaceKind
> {
	path: string & DPath.Path;
	getName(): (string & DPath.Segment) | null;
	getParentPath(): (string & DPath.Path) | null;
	rename(newName: (string & DPath.Segment)): Promise<FileSystemLeft<"rename"> | DEither.Success<FolderInterface>>;
	exists(): Promise<FileSystemLeft<"exists"> | DEither.Ok>;
	relocate(parentPath: string & DPath.Path): Promise<FileSystemLeft<"relocate"> | DEither.Success<FolderInterface>>;
	move(newPath: string & DPath.Path): Promise<FileSystemLeft<"move"> | DEither.Success<FolderInterface>>;
	remove(): Promise<FileSystemLeft<"remove"> | DEither.Ok>;
	getChildren(): Promise<FileSystemLeft<"read-directory"> | DEither.Success<(string & DPath.Path)[]>>;
	stat(): Promise<FileSystemLeft<"stat"> | DEither.Success<StatInfo>>;
	walk(): Promise<FileSystemLeft<"walk-directory"> | DEither.Success<Generator<FolderInterface | FileInterface | UnknownInterface>>>;
}

export function createFolderInterface(path: string & DPath.Path): FolderInterface {
	function getName() {
		return DPath.getBaseName(path);
	}

	function getParentPath() {
		return DPath.getParentFolderPath(path);
	}

	function localRename(newName: string & DPath.Segment) {
		return asyncPipe(
			rename(path, newName),
			DEither.whenIsRight(
				innerPipe(
					createFolderInterface,
					DEither.success,
				),
			),
		);
	}

	function localRelocate(newParentPath: string & DPath.Path) {
		return asyncPipe(
			relocate(path, newParentPath),
			DEither.whenIsRight(
				innerPipe(
					createFolderInterface,
					DEither.success,
				),
			),
		);
	}

	function localMove(newPath: string & DPath.Path) {
		return asyncPipe(
			move(path, newPath),
			DEither.whenIsRight(
				() => DEither.success(
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

	return {
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
		[folderInterfaceKind.runTimeKey]: null,
	} satisfies DKind.Remove<FolderInterface> as never;
}

export function isFolderInterface(
	input: unknown,
): input is FolderInterface {
	return folderInterfaceKind.has(input);
}
