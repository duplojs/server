import * as DEither from "@duplojs/lang/either";
import * as DCommon from "@duplojs/lang/common";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";

function createNodeStatsMock() {
	const now = new Date("2020-01-01T00:00:00Z");
	return {
		isFile: () => false,
		isDirectory: () => false,
		isSymbolicLink: () => false,
		size: 789,
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

describe("unknownInterface", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("detects unknown interface with predicate", () => {
		const unknown = DServerFile.createUnknownInterface(DCommon.infer("/tmp/entry"));
		const file = DServerFile.createFileInterface(DCommon.infer("/tmp/example.json"));
		const folder = DServerFile.createFolderInterface(DCommon.infer("/tmp/demo"));

		expect(DServerFile.isUnknownInterface(unknown)).toBe(true);
		expect(DServerFile.isUnknownInterface(file)).toBe(false);
		expect(DServerFile.isUnknownInterface(folder)).toBe(false);
		expect(DServerFile.isUnknownInterface({})).toBe(false);
	});

	it("creates interface with name and parent path", () => {
		const unknown = DServerFile.createUnknownInterface(DCommon.infer("/tmp/unknown path"));

		expect(unknown.getName()).toBe("unknown path");
		expect(unknown.path).toBe("/tmp/unknown path");
		expect(unknown.getParentPath()).toBe("/tmp");
	});

	it("returns current directory as parent path when no separator is present", () => {
		const unknown = DServerFile.createUnknownInterface(DCommon.infer("file"));

		expect(unknown.getName()).toBe("file");
		expect(unknown.getParentPath()).toBe(".");
	});

	it("checks existence via fs access", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			access: vi.fn().mockResolvedValue(undefined),
		});
		const unknown = DServerFile.createUnknownInterface(DCommon.infer("/tmp/unknown"));

		const result = await unknown.exist();

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.access).toHaveBeenCalledWith("/tmp/unknown");
	});

	it("reads stat info via fs stat", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			stat: vi.fn().mockResolvedValue(createNodeStatsMock()),
		});
		const unknown = DServerFile.createUnknownInterface(DCommon.infer("/tmp/unknown"));

		const result = await unknown.stat();

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.stat).toHaveBeenCalledWith("/tmp/unknown");
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result).sizeBytes).toBe(789);
		}
	});
});
