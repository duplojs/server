import { E } from "@duplojs/utils";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "tests/_utils/fsPromises.mock";
import { setDenoMock } from "tests/_utils/deno.mock";

describe("move", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("moves entry in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			rename: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.move("/tmp/from", "/tmp/to");

		expect(E.isRight(result)).toBe(true);
		expect(fs.rename).toHaveBeenCalledWith("/tmp/from", "/tmp/to");
	});

	it("returns fail when NODE move rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			rename: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.move("/tmp/from", "/tmp/to");

		expect(E.isLeft(result)).toBe(true);
	});

	it("moves entry in DENO env", async() => {
		setEnvironment("DENO");
		const rename = vi.fn().mockResolvedValue(undefined);
		setDenoMock({ rename });

		const result = await DServerFile.move("/tmp/from", "/tmp/to");

		expect(E.isRight(result)).toBe(true);
		expect(rename).toHaveBeenCalledWith("/tmp/from", "/tmp/to");
	});

	it("returns fail when DENO move rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			rename: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.move("/tmp/from", "/tmp/to");

		expect(E.isLeft(result)).toBe(true);
	});
});
