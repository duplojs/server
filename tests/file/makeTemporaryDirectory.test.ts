import { E, unwrap } from "@duplojs/utils";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "tests/_utils/fsPromises.mock";
import { setDenoMock } from "tests/_utils/deno.mock";

describe("makeTemporaryDirectory", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("creates temporary directory in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			mkdtemp: vi.fn().mockResolvedValue("/tmp/prefix-abc"),
		});

		const result = await DServerFile.makeTemporaryDirectory("prefix-");

		expect(E.isRight(result)).toBe(true);
		expect(fs.mkdtemp).toHaveBeenCalledWith("prefix-");
		if (E.isRight(result)) {
			expect(unwrap(result)).toBe("/tmp/prefix-abc");
		}
	});

	it("returns fail when NODE mkdtemp rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			mkdtemp: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.makeTemporaryDirectory("prefix-");

		expect(E.isLeft(result)).toBe(true);
	});

	it("creates temporary directory in DENO env", async() => {
		setEnvironment("DENO");
		const makeTempDir = vi.fn().mockResolvedValue("/tmp/deno-dir");
		setDenoMock({ makeTempDir });

		const result = await DServerFile.makeTemporaryDirectory("prefix-");

		expect(E.isRight(result)).toBe(true);
		expect(makeTempDir).toHaveBeenCalledWith({ prefix: "prefix-" });
	});

	it("returns fail when DENO makeTempDir rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			makeTempDir: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.makeTemporaryDirectory("prefix-");

		expect(E.isLeft(result)).toBe(true);
	});
});
