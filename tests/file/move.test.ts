import * as DEither from "@duplojs/lang/either";
import * as DCommon from "@duplojs/lang/common";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";
import { setDenoMock } from "@tests/_utils/deno.mock";

describe("move", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("moves entry in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			rename: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.move(DCommon.infer("/tmp/from"), DCommon.infer("/tmp/to"));

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.rename).toHaveBeenCalledWith("/tmp/from", "/tmp/to");
	});

	it("returns fail when NODE move rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			rename: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.move(DCommon.infer("/tmp/from"), DCommon.infer("/tmp/to"));

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("moves entry in DENO env", async() => {
		setEnvironment("DENO");
		const rename = vi.fn().mockResolvedValue(undefined);
		setDenoMock({ rename });

		const result = await DServerFile.move(DCommon.infer("/tmp/from"), DCommon.infer("/tmp/to"));

		expect(DEither.isRight(result)).toBe(true);
		expect(rename).toHaveBeenCalledWith("/tmp/from", "/tmp/to");
	});

	it("returns fail when DENO move rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			rename: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.move(DCommon.infer("/tmp/from"), DCommon.infer("/tmp/to"));

		expect(DEither.isLeft(result)).toBe(true);
	});
});
