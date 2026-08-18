import { innerPipe } from "@duplojs/utils";
import * as EE from "@duplojs/utils/either";
import * as DD from "@duplojs/utils/date";
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

declare module "@scripts/implementor" {
	interface ServerUtilsFunction {
		linkStat<
			GenericPath extends string,
		>(
			path: GenericPath,
		): Promise<FileSystemLeft<"link-stat"> | EE.Success<StatInfo>>;
	}
}

/**
 * {@include file/linkStat/index.md}
 */
export const linkStat = implementFunction(
	"linkStat",
	{
		NODE: async(path) => {
			const fs = await nodeFileSystem.value;
			return fs.lstat(path)
				.then(
					innerPipe(
						createStatInfoWithFsSource,
						EE.success,
					),
				)
				.catch((value) => EE.left("file-system-link-stat", value));
		},
		DENO: (path) => Deno
			.lstat(path)
			.then(
				innerPipe(
					createStatInfoWithDeno,
					EE.success,
				),
			)
			.catch((value) => EE.left("file-system-link-stat", value)),
	},
);
