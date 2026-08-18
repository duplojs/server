import { innerPipe } from "@duplojs/utils";
import * as EE from "@duplojs/utils/either";
import * as DD from "@duplojs/utils/date";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { Stats } from "node:fs";
import type { FileSystemLeft } from "./types";

export interface StatInfo {

	/** Type of entry */
	isFile: boolean;
	isDirectory: boolean;
	isSymlink: boolean;

	/** Size in bytes */
	sizeBytes: number;

	/** Timestamps */
	modifiedAt: DD.TheDate | null;
	accessedAt: DD.TheDate | null;
	createdAt: DD.TheDate | null;
	changedAt: DD.TheDate | null;

	/** Unix/FS identifiers */
	deviceId: number;
	inode: number | null;
	permissionsMode: number | null;
	hardLinkCount: number | null;

	/** Ownership */
	ownerUserId: number | null;
	ownerGroupId: number | null;

	/** Special device id (if file is a device) */
	specialDeviceId: number | null;

	/** FS allocation */
	ioBlockSize: number | null;
	allocatedBlockCount: number | null;

	/** Special file kinds */
	isBlockDevice: boolean | null;
	isCharacterDevice: boolean | null;
	isFifo: boolean | null;
	isSocket: boolean | null;
}

declare module "@scripts/implementor" {
	interface ServerUtilsFunction {
		stat<
			GenericPath extends string,
		>(
			path: GenericPath,
		): Promise<FileSystemLeft<"stat"> | EE.Success<StatInfo>>;
	}
}

function createStatInfoWithFsSource(source: Stats): StatInfo {
	return {
		isFile: source.isFile(),
		isDirectory: source.isDirectory(),
		isSymlink: source.isSymbolicLink(),
		sizeBytes: source.size,
		modifiedAt: DD.isSafeTimestamp(source.mtime.getTime()) ? DD.createOrThrow(source.mtime) : null,
		accessedAt: DD.isSafeTimestamp(source.atime.getTime()) ? DD.createOrThrow(source.atime) : null,
		createdAt: DD.isSafeTimestamp(source.birthtime.getTime()) ? DD.createOrThrow(source.birthtime) : null,
		changedAt: DD.isSafeTimestamp(source.ctime.getTime()) ? DD.createOrThrow(source.ctime) : null,
		deviceId: source.dev,
		inode: source.ino,
		permissionsMode: source.mode,
		hardLinkCount: source.nlink,
		ownerUserId: source.uid,
		ownerGroupId: source.gid,
		specialDeviceId: source.rdev,
		ioBlockSize: source.blksize,
		allocatedBlockCount: source.blocks,
		isBlockDevice: source.isBlockDevice(),
		isCharacterDevice: source.isCharacterDevice(),
		isFifo: source.isFIFO(),
		isSocket: source.isSocket(),
	};
}

function createStatInfoWithDeno(source: Deno.FileInfo): StatInfo {
	return {
		isFile: source.isFile,
		isDirectory: source.isDirectory,
		isSymlink: source.isSymlink,
		sizeBytes: source.size,
		modifiedAt: source.mtime
			&& DD.isSafeTimestamp(source.mtime.getTime())
			? DD.createOrThrow(source.mtime)
			: null,
		accessedAt: source.atime
			&& DD.isSafeTimestamp(source.atime.getTime())
			? DD.createOrThrow(source.atime)
			: null,
		createdAt: source.birthtime
			&& DD.isSafeTimestamp(source.birthtime.getTime())
			? DD.createOrThrow(source.birthtime)
			: null,
		changedAt: source.ctime
			&& DD.isSafeTimestamp(source.ctime.getTime())
			? DD.createOrThrow(source.ctime)
			: null,
		deviceId: source.dev,
		inode: source.ino,
		permissionsMode: source.mode,
		hardLinkCount: source.nlink,
		ownerUserId: source.uid,
		ownerGroupId: source.gid,
		specialDeviceId: source.rdev,
		ioBlockSize: source.blksize,
		allocatedBlockCount: source.blocks,
		isBlockDevice: source.isBlockDevice,
		isCharacterDevice: source.isCharDevice,
		isFifo: source.isFifo,
		isSocket: source.isSocket,
	};
}

/**
 * {@include file/stat/index.md}
 */
export const stat = implementFunction(
	"stat",
	{
		NODE: async(path) => {
			const fs = await nodeFileSystem.value;
			return fs.stat(path)
				.then(
					innerPipe(
						createStatInfoWithFsSource,
						EE.success,
					),
				)
				.catch((value) => EE.left("file-system-stat", value));
		},
		DENO: (path) => Deno
			.stat(path)
			.then(
				innerPipe(
					createStatInfoWithDeno,
					EE.success,
				),
			)
			.catch((value) => EE.left("file-system-stat", value)),
		BUN: (path) => Bun.file(path)
			.stat()
			.then(
				innerPipe(
					createStatInfoWithFsSource,
					EE.success,
				),
			)
			.catch((value) => EE.left("file-system-stat", value)),
	},
);
