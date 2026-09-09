import * as DEither from "@duplojs/lang/either";
import * as DCommon from "@duplojs/lang/common";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";
import { setDenoMock } from "@tests/_utils/deno.mock";
import { setBunMock } from "@tests/_utils/bun.mock";

describe("writeTextFile", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("writes text file in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			writeFile: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.writeTextFile(DCommon.infer("/tmp/mock"), "hello");

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.writeFile).toHaveBeenCalledWith("/tmp/mock", "hello", { encoding: "utf-8" });
	});

	it("returns fail when NODE writeTextFile rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			writeFile: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.writeTextFile(DCommon.infer("/tmp/mock"), "hello");

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("writes text file in DENO env", async() => {
		setEnvironment("DENO");
		const spy = vi.fn().mockResolvedValue(undefined);
		setDenoMock({
			writeTextFile: spy,
		});

		const result = await DServerFile.writeTextFile(DCommon.infer("/tmp/mock"), "deno");

		expect(DEither.isRight(result)).toBe(true);
		expect(spy).toHaveBeenCalledWith("/tmp/mock", "deno");
	});

	it("returns fail when DENO writeTextFile rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			writeTextFile: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.writeTextFile(DCommon.infer("/tmp/mock"), "deno");

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("writes text file in BUN env", async() => {
		setEnvironment("BUN");
		const writeSpy = vi.fn().mockResolvedValue(undefined);
		setBunMock({
			file: vi.fn().mockReturnValue({ write: writeSpy }),
		});

		const result = await DServerFile.writeTextFile(DCommon.infer("/tmp/mock"), "bun");

		expect(DEither.isRight(result)).toBe(true);
		expect(writeSpy).toHaveBeenCalledWith("bun");
	});

	it("returns fail when BUN writeTextFile rejects", async() => {
		setEnvironment("BUN");
		setBunMock({
			file: vi.fn().mockReturnValue({
				write: vi.fn().mockRejectedValue(new Error("boom")),
			}),
		});

		const result = await DServerFile.writeTextFile(DCommon.infer("/tmp/mock"), "bun");

		expect(DEither.isLeft(result)).toBe(true);
	});
});
