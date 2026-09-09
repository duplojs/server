import * as DEither from "@duplojs/lang/either";
import * as DCommon from "@duplojs/lang/common";
import { DServerFile, setEnvironment } from "@scripts";
import type * as DPath from "@duplojs/lang/path";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";
import { setDenoMock } from "@tests/_utils/deno.mock";

describe("ensureFile", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("ensures file in NODE env", async() => {
		setEnvironment("NODE");
		const close = vi.fn().mockResolvedValue(undefined);
		const fs = setFsPromisesMock({
			open: vi.fn().mockResolvedValue({ close }),
		});

		const result = await DServerFile.ensureFile<string & DPath.Path>(DCommon.infer("/tmp/mock"));

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.open).toHaveBeenCalledWith("/tmp/mock", "a");
		expect(close).toHaveBeenCalled();
	});

	it("returns fail when NODE ensureFile rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			open: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.ensureFile<string & DPath.Path>(DCommon.infer("/tmp/mock"));

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("ensures file in DENO env", async() => {
		setEnvironment("DENO");
		const close = vi.fn();
		const open = vi.fn().mockResolvedValue({ close });
		setDenoMock({ open });

		const result = await DServerFile.ensureFile<string & DPath.Path>(DCommon.infer("/tmp/mock"));

		expect(DEither.isRight(result)).toBe(true);
		expect(open).toHaveBeenCalledWith("/tmp/mock", {
			write: true,
			create: true,
			append: true,
		});
		expect(close).toHaveBeenCalled();
	});

	it("returns fail when DENO ensureFile rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			open: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.ensureFile<string & DPath.Path>(DCommon.infer("/tmp/mock"));

		expect(DEither.isLeft(result)).toBe(true);
	});
});
