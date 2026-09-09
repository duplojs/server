import * as DEither from "@duplojs/lang/either";
import * as DCommon from "@duplojs/lang/common";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";

function createNodeStatsMock() {
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
	};
}

describe("fileInterface", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("detects file interface with predicate", () => {
		const file = DServerFile.createFileInterface(DCommon.infer("/tmp/example.json"));
		const folder = DServerFile.createFolderInterface(DCommon.infer("/tmp/demo"));
		const unknown = DServerFile.createUnknownInterface(DCommon.infer("/tmp/entry"));

		const unknownValue: unknown = undefined;

		if (DServerFile.isFileInterface(unknownValue)) {
			type check = DCommon.ExpectType<
				typeof unknownValue,
				DServerFile.FileInterface,
				"strict"
			>;
		}

		expect(DServerFile.isFileInterface(file)).toBe(true);
		expect(DServerFile.isFileInterface(folder)).toBe(false);
		expect(DServerFile.isFileInterface(unknown)).toBe(false);
		expect(DServerFile.isFileInterface({})).toBe(false);
	});

	it("creates interface with name and mime info", () => {
		const file = DServerFile.createFileInterface(DCommon.infer("/tmp/example.json"));

		expect(file.getName()).toBe("example.json");
		expect(file.getExtension()).toBe("json");
		expect(file.getMimeType()).toBe("application/json");
		expect(file.getParentPath()).toBe("/tmp");
	});

	it("creates interface with unknown extension", () => {
		const file = DServerFile.createFileInterface(DCommon.infer("/tmp/unknown file.zzz"));

		expect(file.path).toBe("/tmp/unknown file.zzz");
		expect(file.getExtension()).toBe("zzz");
		expect(file.getMimeType()).toBe(null);
	});

	it("returns null mime type when no extension exists", () => {
		const file = DServerFile.createFileInterface(DCommon.infer("/tmp/file"));

		expect(file.getExtension()).toBe(null);
		expect(file.getMimeType()).toBe(null);
	});

	it("returns current directory as parent path when no separator is present", () => {
		const file = DServerFile.createFileInterface(DCommon.infer("file"));

		expect(file.getName()).toBe("file");
		expect(file.getParentPath()).toBe(".");
	});

	it("renames file and returns new interface", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			rename: vi.fn().mockResolvedValue(undefined),
		});
		const file = DServerFile.createFileInterface(DCommon.infer("/tmp/example.json"));

		const result = await file.rename(DCommon.infer("next.json"));

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.rename).toHaveBeenCalledWith("/tmp/example.json", "/tmp/next.json");
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result).path).toBe("/tmp/next.json");
		}
	});

	it("checks existence via fs access", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			access: vi.fn().mockResolvedValue(undefined),
		});
		const file = DServerFile.createFileInterface(DCommon.infer("/tmp/example.json"));

		const result = await file.exists();

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.access).toHaveBeenCalledWith("/tmp/example.json");
	});

	it("removes file via fs rm", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			rm: vi.fn().mockResolvedValue(undefined),
		});
		const file = DServerFile.createFileInterface(DCommon.infer("/tmp/example.json"));

		const result = await file.remove();

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.rm).toHaveBeenCalledWith("/tmp/example.json", {
			recursive: false,
			force: true,
		});
	});

	it("reads stat info via fs stat", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			stat: vi.fn().mockResolvedValue(createNodeStatsMock()),
		});
		const file = DServerFile.createFileInterface(DCommon.infer("/tmp/example.json"));

		const result = await file.stat();

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.stat).toHaveBeenCalledWith("/tmp/example.json");
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result).sizeBytes).toBe(123);
		}
	});

	it("relocates file using move", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			rename: vi.fn().mockResolvedValue(undefined),
		});
		const file = DServerFile.createFileInterface(DCommon.infer("/tmp/example.json"));

		const result = await file.relocate(DCommon.infer("/new/parent"));

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.rename).toHaveBeenCalledWith("/tmp/example.json", "/new/parent/example.json");
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result).path).toBe("/new/parent/example.json");
		}
	});

	it("moves file to new path", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			rename: vi.fn().mockResolvedValue(undefined),
		});
		const file = DServerFile.createFileInterface(DCommon.infer("/tmp/example.json"));

		const result = await file.move(DCommon.infer("/new/path/example.json"));

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.rename).toHaveBeenCalledWith("/tmp/example.json", "/new/path/example.json");
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result).path).toBe("/new/path/example.json");
		}
	});

	it("getExtension name with dot", () => {
		const file = DServerFile.createFileInterface(DCommon.infer("/tmp/file.txt"));

		expect(file.getExtension()).toBe("txt");
		expect(file.getExtension({ withDot: true })).toBe(".txt");
	});
});
