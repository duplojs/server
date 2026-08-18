import { E, type ExpectType, unwrap } from "@duplojs/utils";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "tests/_utils/fsPromises.mock";

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
		const folder = DServerFile.createFolderInterface("/tmp/demo");
		const file = DServerFile.createFileInterface("/tmp/example.json");
		const unknown = DServerFile.createUnknownInterface("/tmp/entry");

		const unknownValue: unknown = undefined;

		if (DServerFile.isFolderInterface(unknownValue)) {
			type check = ExpectType<
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
		const folder = DServerFile.createFolderInterface("/tmp/demo");

		expect(folder.getName()).toBe("demo");
		expect(folder.path).toBe("/tmp/demo");
		expect(folder.getParentPath()).toBe("/tmp");
	});

	it("returns null parent path when no separator is present", () => {
		const folder = DServerFile.createFolderInterface("folder");

		expect(folder.getName()).toBe("folder");
		expect(folder.getParentPath()).toBe(null);
	});

	it("renames folder and returns new interface", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			rename: vi.fn().mockResolvedValue(undefined),
		});
		const folder = DServerFile.createFolderInterface("/tmp/demo");

		const result = await folder.rename("next");

		expect(E.isRight(result)).toBe(true);
		expect(fs.rename).toHaveBeenCalledWith("/tmp/demo", "/tmp/next");
		if (E.isRight(result)) {
			expect(unwrap(result).path).toBe("/tmp/next");
		}
	});

	it("relocates folder using move", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			rename: vi.fn().mockResolvedValue(undefined),
		});
		const folder = DServerFile.createFolderInterface("/tmp/demo");

		const result = await folder.relocate("/new/parent");

		expect(E.isRight(result)).toBe(true);
		expect(fs.rename).toHaveBeenCalledWith("/tmp/demo", "/new/parent/demo");
		if (E.isRight(result)) {
			expect(unwrap(result).path).toBe("/new/parent/demo");
		}
	});

	it("moves folder to new path", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			rename: vi.fn().mockResolvedValue(undefined),
		});
		const folder = DServerFile.createFolderInterface("/tmp/demo");

		const result = await folder.move("/new/path/demo");

		expect(E.isRight(result)).toBe(true);
		expect(fs.rename).toHaveBeenCalledWith("/tmp/demo", "/new/path/demo");
		if (E.isRight(result)) {
			expect(unwrap(result).path).toBe("/new/path/demo");
		}
	});

	it("checks existence via fs access", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			access: vi.fn().mockResolvedValue(undefined),
		});
		const folder = DServerFile.createFolderInterface("/tmp/demo");

		const result = await folder.exists();

		expect(E.isRight(result)).toBe(true);
		expect(fs.access).toHaveBeenCalledWith("/tmp/demo");
	});

	it("removes folder", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			rm: vi.fn().mockResolvedValue(undefined),
		});
		const folder = DServerFile.createFolderInterface("/tmp/demo");

		const result = await folder.remove();

		expect(E.isRight(result)).toBe(true);
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
		const folder = DServerFile.createFolderInterface("/tmp/demo");

		const result = await folder.getChildren();

		expect(E.isRight(result)).toBe(true);
		expect(fs.readdir).toHaveBeenCalledWith("/tmp/demo", { recursive: undefined });
		if (E.isRight(result)) {
			expect(unwrap(result)).toEqual(["a", "b"]);
		}
	});

	it("reads stat info via fs stat", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			stat: vi.fn().mockResolvedValue(createNodeStatsMock()),
		});
		const folder = DServerFile.createFolderInterface("/tmp/demo");

		const result = await folder.stat();

		expect(E.isRight(result)).toBe(true);
		expect(fs.stat).toHaveBeenCalledWith("/tmp/demo");
		if (E.isRight(result)) {
			expect(unwrap(result).sizeBytes).toBe(456);
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
		const folder = DServerFile.createFolderInterface("/tmp/demo");

		const result = await folder.walk();

		expect(E.isRight(result)).toBe(true);
		expect(fs.readdir).toHaveBeenCalledWith("/tmp/demo", {
			recursive: false,
			withFileTypes: true,
		});
		if (E.isRight(result)) {
			const items = Array.from(unwrap(result));
			expect(items[0]?.getName()).toBe("file.json");
		}
	});
});
