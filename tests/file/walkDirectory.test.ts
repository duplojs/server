import * as DEither from "@duplojs/lang/either";
import * as DArray from "@duplojs/lang/array";
import * as DCommon from "@duplojs/lang/common";
import { DServerFile, setEnvironment } from "@scripts";
import type * as DPath from "@duplojs/lang/path";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";

describe("walkDirectory", () => {
	afterEach(() => {
		vi.clearAllMocks();
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
				{
					parentPath: "/tmp/demo",
					name: "sub",
					isFile: () => false,
					isDirectory: () => true,
				},
				{
					parentPath: "/tmp/demo",
					name: "other.zzz",
					isFile: () => false,
					isDirectory: () => false,
				},
			]),
		});

		const result = await DServerFile.walkDirectory<string & DPath.Path>(DCommon.infer("/tmp/demo"));

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.readdir).toHaveBeenCalledWith("/tmp/demo", {
			recursive: false,
			withFileTypes: true,
		});
		if (DEither.isRight(result)) {
			const items = DArray.from(DEither.unwrapRight(result));
			expect(items[0]?.getName()).toBe("file.json");
			expect((items[0] as DServerFile.FileInterface).getMimeType()).toBe("application/json");
			expect(items[1]?.getName()).toBe("sub");
			expect(items[2]?.getName()).toBe("other.zzz");
		}
	});

	it("returns fail when NODE readdir rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			readdir: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.walkDirectory<string & DPath.Path>(DCommon.infer("/tmp/demo"));

		expect(DEither.isLeft(result)).toBe(true);
	});
});
