import { E, unwrap } from "@duplojs/utils";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "../_utils/fsPromises.mock";
import { setDenoMock } from "../_utils/deno.mock";

interface DenoFileInfoMock {
	isFile: boolean;
	isDirectory: boolean;
	isSymlink: boolean;
	size: number;
	mtime: Date | null;
	atime: Date | null;
	birthtime: Date | null;
	ctime: Date | null;
	dev: number | null;
	ino: number | null;
	mode: number | null;
	nlink: number | null;
	uid: number | null;
	gid: number | null;
	rdev: number | null;
	blksize: number | null;
	blocks: number | null;
	isBlockDevice: boolean | null;
	isCharDevice: boolean | null;
	isFifo: boolean | null;
	isSocket: boolean | null;
}

function createNodeStatsMock(overrides: Partial<Record<string, unknown>> = {}) {
	const now = new Date("2020-01-01T00:00:00Z");
	return {
		isFile: () => true,
		isDirectory: () => false,
		isSymbolicLink: () => true,
		size: 123,
		mtime: now,
		atime: now,
		birthtime: now,
		ctime: now,
		dev: 1,
		ino: 2,
		mode: 3,
		nlink: 4,
		uid: 5,
		gid: 6,
		rdev: 7,
		blksize: 8,
		blocks: 9,
		isBlockDevice: () => false,
		isCharacterDevice: () => false,
		isFIFO: () => false,
		isSocket: () => false,
		...overrides,
	};
}

function createDenoFileInfoMock(overrides: Partial<DenoFileInfoMock> = {}): DenoFileInfoMock {
	const now = new Date("2020-01-01T00:00:00Z");
	return {
		isFile: true,
		isDirectory: false,
		isSymlink: true,
		size: 321,
		mtime: now,
		atime: now,
		birthtime: now,
		ctime: now,
		dev: 10,
		ino: 20,
		mode: 30,
		nlink: 40,
		uid: 50,
		gid: 60,
		rdev: 70,
		blksize: 80,
		blocks: 90,
		isBlockDevice: false,
		isCharDevice: false,
		isFifo: false,
		isSocket: false,
		...overrides,
	};
}

describe("linkStat", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("returns link stat info in NODE env", async() => {
		setEnvironment("NODE");
		const stats = createNodeStatsMock({ size: 777 });
		setFsPromisesMock({
			lstat: vi.fn().mockResolvedValue(stats),
		});

		const result = await DServerFile.linkStat("/tmp/mock");

		expect(E.isRight(result)).toBe(true);
		if (E.isRight(result)) {
			expect(unwrap(result).sizeBytes).toBe(777);
		}
	});

	it("returns null timestamps when NODE stats are invalid", async() => {
		setEnvironment("NODE");
		const invalidDate = new Date("invalid");
		const stats = createNodeStatsMock({
			mtime: invalidDate,
			atime: invalidDate,
			birthtime: invalidDate,
			ctime: invalidDate,
		});
		setFsPromisesMock({
			lstat: vi.fn().mockResolvedValue(stats),
		});

		const result = await DServerFile.linkStat("/tmp/mock");

		expect(E.isRight(result)).toBe(true);
		if (E.isRight(result)) {
			const info = unwrap(result);
			expect(info.modifiedAt).toBe(null);
			expect(info.accessedAt).toBe(null);
			expect(info.createdAt).toBe(null);
			expect(info.changedAt).toBe(null);
		}
	});

	it("returns fail when NODE lstat rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			lstat: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.linkStat("/tmp/mock");

		expect(E.isLeft(result)).toBe(true);
	});

	it("returns link stat info in DENO env", async() => {
		setEnvironment("DENO");
		const fileInfo = createDenoFileInfoMock({ size: 888 });
		setDenoMock({
			lstat: vi.fn().mockResolvedValue(fileInfo),
		});

		const result = await DServerFile.linkStat("/tmp/mock");

		expect(E.isRight(result)).toBe(true);
		if (E.isRight(result)) {
			expect(unwrap(result).sizeBytes).toBe(888);
		}
	});

	it("returns null timestamps when DENO stats are missing", async() => {
		setEnvironment("DENO");
		const fileInfo = createDenoFileInfoMock({
			mtime: null,
			atime: null,
			birthtime: null,
			ctime: null,
		});
		setDenoMock({
			lstat: vi.fn().mockResolvedValue(fileInfo),
		});

		const result = await DServerFile.linkStat("/tmp/mock");

		expect(E.isRight(result)).toBe(true);
		if (E.isRight(result)) {
			const info = unwrap(result);
			expect(info.modifiedAt).toBe(null);
			expect(info.accessedAt).toBe(null);
			expect(info.createdAt).toBe(null);
			expect(info.changedAt).toBe(null);
		}
	});

	it("returns fail when DENO lstat rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			lstat: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.linkStat("/tmp/mock");

		expect(E.isLeft(result)).toBe(true);
	});
});
