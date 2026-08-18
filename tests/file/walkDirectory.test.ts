import { A, E, unwrap } from "@duplojs/utils";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "tests/_utils/fsPromises.mock";

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

		const result = await DServerFile.walkDirectory("/tmp/demo");

		expect(E.isRight(result)).toBe(true);
		expect(fs.readdir).toHaveBeenCalledWith("/tmp/demo", {
			recursive: false,
			withFileTypes: true,
		});
		if (E.isRight(result)) {
			const items = A.from(unwrap(result));
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

		const result = await DServerFile.walkDirectory("/tmp/demo");

		expect(E.isLeft(result)).toBe(true);
	});
});
