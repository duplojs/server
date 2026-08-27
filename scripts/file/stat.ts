import { innerPipe } from "@duplojs/lang";
import type * as DPath from "@duplojs/lang/path";
import * as DEither from "@duplojs/lang/either";
import * as DChrono from "@duplojs/lang/chrono";
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
	modifiedAt: DChrono.TheDate | null;
	accessedAt: DChrono.TheDate | null;
	createdAt: DChrono.TheDate | null;
	changedAt: DChrono.TheDate | null;

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
	interface ServerFunction {
		stat<
			GenericPath extends string & DPath.Path,
		>(
			path: GenericPath,
		): Promise<FileSystemLeft<"stat"> | DEither.Success<StatInfo>>;
	}
}

function createStatInfoWithFsSource(source: Stats): StatInfo {
	return {
		isFile: source.isFile(),
		isDirectory: source.isDirectory(),
		isSymlink: source.isSymbolicLink(),
		sizeBytes: source.size,
		modifiedAt: DChrono.isSafeTimestamp(source.mtime.getTime())
			? DChrono.createDateOrThrow(source.mtime)
			: null,
		accessedAt: DChrono.isSafeTimestamp(source.atime.getTime())
			? DChrono.createDateOrThrow(source.atime)
			: null,
		createdAt: DChrono.isSafeTimestamp(source.birthtime.getTime())
			? DChrono.createDateOrThrow(source.birthtime)
			: null,
		changedAt: DChrono.isSafeTimestamp(source.ctime.getTime())
			? DChrono.createDateOrThrow(source.ctime)
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
			&& DChrono.isSafeTimestamp(source.mtime.getTime())
			? DChrono.createDateOrThrow(source.mtime)
			: null,
		accessedAt: source.atime
			&& DChrono.isSafeTimestamp(source.atime.getTime())
			? DChrono.createDateOrThrow(source.atime)
			: null,
		createdAt: source.birthtime
			&& DChrono.isSafeTimestamp(source.birthtime.getTime())
			? DChrono.createDateOrThrow(source.birthtime)
			: null,
		changedAt: source.ctime
			&& DChrono.isSafeTimestamp(source.ctime.getTime())
			? DChrono.createDateOrThrow(source.ctime)
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

export const stat = implementFunction(
	"stat",
	{
		NODE: async(path) => {
			const fs = await nodeFileSystem.value;
			return fs.stat(path)
				.then(
					innerPipe(
						createStatInfoWithFsSource,
						DEither.success,
					),
				)
				.catch((value) => DEither.left("file-system-stat", value));
		},
		DENO: (path) => Deno
			.stat(path)
			.then(
				innerPipe(
					createStatInfoWithDeno,
					DEither.success,
				),
			)
			.catch((value) => DEither.left("file-system-stat", value)),
		BUN: (path) => Bun.file(path)
			.stat()
			.then(
				innerPipe(
					createStatInfoWithFsSource,
					DEither.success,
				),
			)
			.catch((value) => DEither.left("file-system-stat", value)),
	},
);
