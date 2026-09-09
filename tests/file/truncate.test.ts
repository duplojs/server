import * as DEither from "@duplojs/lang/either";
import * as DCommon from "@duplojs/lang/common";
import { DServerFile, setEnvironment } from "@scripts";
import type * as DPath from "@duplojs/lang/path";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";
import { setDenoMock } from "@tests/_utils/deno.mock";

describe("truncate", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("truncates file in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			truncate: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.truncate<string & DPath.Path>(DCommon.infer("/tmp/mock"), 10);

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.truncate).toHaveBeenCalledWith("/tmp/mock", 10);
	});

	it("returns fail when NODE truncate rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			truncate: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.truncate<string & DPath.Path>(DCommon.infer("/tmp/mock"), 10);

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("truncates file in DENO env", async() => {
		setEnvironment("DENO");
		const truncate = vi.fn().mockResolvedValue(undefined);
		setDenoMock({ truncate });

		const result = await DServerFile.truncate<string & DPath.Path>(DCommon.infer("/tmp/mock file"), 5);

		expect(DEither.isRight(result)).toBe(true);
		expect(truncate).toHaveBeenCalledWith("/tmp/mock file", 5);
	});

	it("truncates URL file path in DENO env", async() => {
		setEnvironment("DENO");
		const truncate = vi.fn().mockResolvedValue(undefined);
		setDenoMock({ truncate });

		const result = await DServerFile.truncate(new URL("file:///tmp/mock%20file") as never);

		expect(DEither.isRight(result)).toBe(true);
		expect(truncate).toHaveBeenCalledWith("/tmp/mock file", undefined);
	});

	it("returns fail when DENO truncate rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			truncate: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.truncate<string & DPath.Path>(DCommon.infer("/tmp/mock"), 5);

		expect(DEither.isLeft(result)).toBe(true);
	});
});
