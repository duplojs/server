import { E, unwrap } from "@duplojs/utils";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "../_utils/fsPromises.mock";
import { setDenoMock } from "../_utils/deno.mock";
import { setBunMock } from "../_utils/bun.mock";

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
		isSymbolicLink: () => false,
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
		isSymlink: false,
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

describe("stat", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("returns stat info in NODE env", async() => {
		setEnvironment("NODE");
		const stats = createNodeStatsMock();
		setFsPromisesMock({
			stat: vi.fn().mockResolvedValue(stats),
		});

		const result = await DServerFile.stat("/tmp/mock");

		expect(E.isRight(result)).toBe(true);
		if (E.isRight(result)) {
			const info = unwrap(result);
			expect(info.isFile).toBe(true);
			expect(info.sizeBytes).toBe(123);
			expect(info.deviceId).toBe(1);
			expect(info.inode).toBe(2);
			expect(info.permissionsMode).toBe(3);
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
			stat: vi.fn().mockResolvedValue(stats),
		});

		const result = await DServerFile.stat("/tmp/mock");

		expect(E.isRight(result)).toBe(true);
		if (E.isRight(result)) {
			const info = unwrap(result);
			expect(info.modifiedAt).toBe(null);
			expect(info.accessedAt).toBe(null);
			expect(info.createdAt).toBe(null);
			expect(info.changedAt).toBe(null);
		}
	});

	it("returns fail when NODE stat rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			stat: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.stat("/tmp/mock");

		expect(E.isLeft(result)).toBe(true);
	});

	it("returns stat info in DENO env", async() => {
		setEnvironment("DENO");
		const fileInfo = createDenoFileInfoMock();
		setDenoMock({
			stat: vi.fn().mockResolvedValue(fileInfo),
		});

		const result = await DServerFile.stat("/tmp/mock");

		expect(E.isRight(result)).toBe(true);
		if (E.isRight(result)) {
			const info = unwrap(result);
			expect(info.isDirectory).toBe(false);
			expect(info.sizeBytes).toBe(321);
			expect(info.deviceId).toBe(10);
			expect(info.inode).toBe(20);
			expect(info.permissionsMode).toBe(30);
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
			stat: vi.fn().mockResolvedValue(fileInfo),
		});

		const result = await DServerFile.stat("/tmp/mock");

		expect(E.isRight(result)).toBe(true);
		if (E.isRight(result)) {
			const info = unwrap(result);
			expect(info.modifiedAt).toBe(null);
			expect(info.accessedAt).toBe(null);
			expect(info.createdAt).toBe(null);
			expect(info.changedAt).toBe(null);
		}
	});

	it("returns fail when DENO stat rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			stat: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.stat("/tmp/mock");

		expect(E.isLeft(result)).toBe(true);
	});

	it("returns stat info in BUN env", async() => {
		setEnvironment("BUN");
		const stats = createNodeStatsMock({ size: 555 });
		setBunMock({
			file: vi.fn().mockReturnValue({
				stat: vi.fn().mockResolvedValue(stats),
			}),
		});

		const result = await DServerFile.stat("/tmp/mock");

		expect(E.isRight(result)).toBe(true);
		if (E.isRight(result)) {
			expect(unwrap(result).sizeBytes).toBe(555);
		}
	});

	it("returns fail when BUN stat rejects", async() => {
		setEnvironment("BUN");
		setBunMock({
			file: vi.fn().mockReturnValue({
				stat: vi.fn().mockRejectedValue(new Error("boom")),
			}),
		});

		const result = await DServerFile.stat("/tmp/mock");

		expect(E.isLeft(result)).toBe(true);
	});
});
