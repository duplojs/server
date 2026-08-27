import { innerPipe } from "@duplojs/lang";
import type * as DPath from "@duplojs/lang/path";
import * as DEither from "@duplojs/lang/either";
import * as DChrono from "@duplojs/lang/chrono";
import { implementFunction, nodeFileSystem } from "@scripts/implementor";
import type { StatInfo } from "./stat";
import type { Stats } from "node:fs";
import type { FileSystemLeft } from "./types";

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

declare module "@scripts/implementor" {
	interface ServerFunction {
		linkStat<
			GenericPath extends string & DPath.Path,
		>(
			path: GenericPath,
		): Promise<FileSystemLeft<"link-stat"> | DEither.Success<StatInfo>>;
	}
}

export const linkStat = implementFunction(
	"linkStat",
	{
		NODE: async(path) => {
			const fs = await nodeFileSystem.value;
			return fs.lstat(path)
				.then(
					innerPipe(
						createStatInfoWithFsSource,
						DEither.success,
					),
				)
				.catch((value) => DEither.left("file-system-link-stat", value));
		},
		DENO: (path) => Deno
			.lstat(path)
			.then(
				innerPipe(
					createStatInfoWithDeno,
					DEither.success,
				),
			)
			.catch((value) => DEither.left("file-system-link-stat", value)),
	},
);
