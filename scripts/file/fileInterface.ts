import { asyncPipe, mimeType, innerPipe } from "@duplojs/lang";
import type * as DKind from "@duplojs/lang/kind";
import * as DPath from "@duplojs/lang/path";
import * as DEither from "@duplojs/lang/either";
import { createKind } from "@scripts/kind";
import { rename } from "./rename";
import { exists } from "./exists";
import { move } from "./move";
import { remove } from "./remove";
import { type StatInfo, stat } from "./stat";
import type { FileSystemLeft } from "./types";
import { relocate } from "./relocate";

const fileInterfaceKind = createKind("fileInterface");

export interface FileInterface extends DKind.Kind<
	typeof fileInterfaceKind
> {
	path: string & DPath.Path;
	getName(): (string & DPath.Segment) | null;
	getMimeType(): string | null;
	getExtension(params?: DPath.GetExtensionNameParams): (string & DPath.Segment) | null;
	getParentPath(): (string & DPath.Path) | null;
	rename(newName: string & DPath.Segment): Promise<FileSystemLeft<"rename"> | DEither.Success<FileInterface>>;
	relocate(parentPath: string & DPath.Path): Promise<FileSystemLeft<"relocate"> | DEither.Success<FileInterface>>;
	move(newPath: string & DPath.Path): Promise<FileSystemLeft<"move"> | DEither.Success<FileInterface>>;
	exists(): Promise<FileSystemLeft<"exists"> | DEither.Ok>;
	remove(): Promise<FileSystemLeft<"remove"> | DEither.Ok>;
	stat(): Promise<FileSystemLeft<"stat"> | DEither.Success<StatInfo>>;
}

export function createFileInterface(
	path: string & DPath.Path,
): FileInterface {
	function getName() {
		return DPath.getBaseName(path);
	}

	function getExtension(params?: DPath.GetExtensionNameParams) {
		return DPath.getExtensionName(path, params);
	}

	function getMimeType() {
		const extension = getExtension();

		if (!extension) {
			return null;
		}

		return mimeType.get(extension) ?? null;
	}

	function getParentPath() {
		return DPath.getParentFolderPath(path);
	}

	function localExists() {
		return exists(path);
	}

	function localRename(newName: string & DPath.Segment) {
		return asyncPipe(
			rename(path, newName),
			DEither.whenIsRight(
				innerPipe(
					createFileInterface,
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
					createFileInterface,
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

	return {
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
		[fileInterfaceKind.runTimeKey]: null,
	} satisfies DKind.Remove<FileInterface> as never;
}

export function isFileInterface(
	input: unknown,
): input is FileInterface {
	return fileInterfaceKind.has(input);
}
