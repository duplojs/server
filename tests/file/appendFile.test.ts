import { E } from "@duplojs/utils";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "../_utils/fsPromises.mock";
import { setDenoMock } from "../_utils/deno.mock";

describe("appendFile", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("appends file in NODE env", async() => {
		setEnvironment("NODE");
		const data = new Uint8Array([1]);
		const fs = setFsPromisesMock({
			appendFile: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.appendFile("/tmp/mock", data);

		expect(E.isRight(result)).toBe(true);
		expect(fs.appendFile).toHaveBeenCalledWith("/tmp/mock", data);
	});

	it("returns fail when NODE appendFile rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			appendFile: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.appendFile("/tmp/mock", new Uint8Array([2]));

		expect(E.isLeft(result)).toBe(true);
	});

	it("appends file in DENO env", async() => {
		setEnvironment("DENO");
		const spy = vi.fn().mockResolvedValue(undefined);
		setDenoMock({
			writeFile: spy,
		});

		const data = new Uint8Array([3]);
		const result = await DServerFile.appendFile("/tmp/mock", data);

		expect(E.isRight(result)).toBe(true);
		expect(spy).toHaveBeenCalledWith("/tmp/mock", data, { append: true });
	});

	it("returns fail when DENO appendFile rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			writeFile: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.appendFile("/tmp/mock", new Uint8Array([4]));

		expect(E.isLeft(result)).toBe(true);
	});
});
