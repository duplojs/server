import * as DEither from "@duplojs/lang/either";
import * as DCommon from "@duplojs/lang/common";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";

function createNodeStatsMock() {
	const now = new Date("2020-01-01T00:00:00Z");
	return {
		isFile: () => false,
		isDirectory: () => true,
		isSymbolicLink: () => false,
		size: 456,
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

describe("folderInterface", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("detects folder interface with predicate", () => {
		const folder = DServerFile.createFolderInterface(DCommon.infer("/tmp/demo"));
		const file = DServerFile.createFileInterface(DCommon.infer("/tmp/example.json"));
		const unknown = DServerFile.createUnknownInterface(DCommon.infer("/tmp/entry"));

		const unknownValue: unknown = undefined;

		if (DServerFile.isFolderInterface(unknownValue)) {
			type check = DCommon.ExpectType<
				typeof unknownValue,
				DServerFile.FolderInterface,
				"strict"
			>;
		}

		expect(DServerFile.isFolderInterface(folder)).toBe(true);
		expect(DServerFile.isFolderInterface(file)).toBe(false);
		expect(DServerFile.isFolderInterface(unknown)).toBe(false);
		expect(DServerFile.isFolderInterface({})).toBe(false);
	});

	it("creates interface with name and parent path", () => {
		const folder = DServerFile.createFolderInterface(DCommon.infer("/tmp/demo"));

		expect(folder.getName()).toBe("demo");
		expect(folder.path).toBe("/tmp/demo");
		expect(folder.getParentPath()).toBe("/tmp");
	});

	it("returns current directory as parent path when no separator is present", () => {
		const folder = DServerFile.createFolderInterface(DCommon.infer("folder"));

		expect(folder.getName()).toBe("folder");
		expect(folder.getParentPath()).toBe(".");
	});

	it("renames folder and returns new interface", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			rename: vi.fn().mockResolvedValue(undefined),
		});
		const folder = DServerFile.createFolderInterface(DCommon.infer("/tmp/demo"));

		const result = await folder.rename(DCommon.infer("next"));

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.rename).toHaveBeenCalledWith("/tmp/demo", "/tmp/next");
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result).path).toBe("/tmp/next");
		}
	});

	it("relocates folder using move", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			rename: vi.fn().mockResolvedValue(undefined),
		});
		const folder = DServerFile.createFolderInterface(DCommon.infer("/tmp/demo"));

		const result = await folder.relocate(DCommon.infer("/new/parent"));

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.rename).toHaveBeenCalledWith("/tmp/demo", "/new/parent/demo");
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result).path).toBe("/new/parent/demo");
		}
	});

	it("moves folder to new path", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			rename: vi.fn().mockResolvedValue(undefined),
		});
		const folder = DServerFile.createFolderInterface(DCommon.infer("/tmp/demo"));

		const result = await folder.move(DCommon.infer("/new/path/demo"));

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.rename).toHaveBeenCalledWith("/tmp/demo", "/new/path/demo");
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result).path).toBe("/new/path/demo");
		}
	});

	it("checks existence via fs access", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			access: vi.fn().mockResolvedValue(undefined),
		});
		const folder = DServerFile.createFolderInterface(DCommon.infer("/tmp/demo"));

		const result = await folder.exists();

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.access).toHaveBeenCalledWith("/tmp/demo");
	});

	it("removes folder", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			rm: vi.fn().mockResolvedValue(undefined),
		});
		const folder = DServerFile.createFolderInterface(DCommon.infer("/tmp/demo"));

		const result = await folder.remove();

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.rm).toHaveBeenCalledWith("/tmp/demo", {
			recursive: false,
			force: true,
		});
	});

	it("reads children via readDirectory", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			readdir: vi.fn().mockResolvedValue(["a", "b"]),
		});
		const folder = DServerFile.createFolderInterface(DCommon.infer("/tmp/demo"));

		const result = await folder.getChildren();

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.readdir).toHaveBeenCalledWith("/tmp/demo", { recursive: undefined });
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result)).toEqual(["a", "b"]);
		}
	});

	it("reads stat info via fs stat", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			stat: vi.fn().mockResolvedValue(createNodeStatsMock()),
		});
		const folder = DServerFile.createFolderInterface(DCommon.infer("/tmp/demo"));

		const result = await folder.stat();

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.stat).toHaveBeenCalledWith("/tmp/demo");
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result).sizeBytes).toBe(456);
		}
	});

	it("walks directory and maps entries", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			readdir: vi.fn().mockResolvedValue([
				{
					parentPath: "/tmp/demo",
					name: "file.json",
					isFile: () => true,
					isDirectory: () => false,
				},
			]),
		});
		const folder = DServerFile.createFolderInterface(DCommon.infer("/tmp/demo"));

		const result = await folder.walk();

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.readdir).toHaveBeenCalledWith("/tmp/demo", {
			recursive: false,
			withFileTypes: true,
		});
		if (DEither.isRight(result)) {
			const items = Array.from(DEither.unwrapRight(result));
			expect(items[0]?.getName()).toBe("file.json");
		}
	});
});
