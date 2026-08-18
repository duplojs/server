import { E } from "@duplojs/utils";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "../_utils/fsPromises.mock";
import { setDenoMock } from "../_utils/deno.mock";

describe("appendTextFile", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("appends text file in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			appendFile: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.appendTextFile("/tmp/mock", "hello");

		expect(E.isRight(result)).toBe(true);
		expect(fs.appendFile).toHaveBeenCalledWith("/tmp/mock", "hello");
	});

	it("returns fail when NODE appendTextFile rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			appendFile: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.appendTextFile("/tmp/mock", "hello");

		expect(E.isLeft(result)).toBe(true);
	});

	it("appends text file in DENO env", async() => {
		setEnvironment("DENO");
		const spy = vi.fn().mockResolvedValue(undefined);
		setDenoMock({
			writeTextFile: spy,
		});

		const result = await DServerFile.appendTextFile("/tmp/mock", "deno");

		expect(E.isRight(result)).toBe(true);
		expect(spy).toHaveBeenCalledWith("/tmp/mock", "deno", { append: true });
	});

	it("returns fail when DENO appendTextFile rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			writeTextFile: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.appendTextFile("/tmp/mock", "deno");

		expect(E.isLeft(result)).toBe(true);
	});
});
