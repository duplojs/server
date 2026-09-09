import * as DEither from "@duplojs/lang/either";
import * as DChrono from "@duplojs/lang/chrono";
import * as DCommon from "@duplojs/lang/common";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";
import { setDenoMock } from "@tests/_utils/deno.mock";

describe("setTime", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("sets time in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			utimes: vi.fn().mockResolvedValue(undefined),
		});
		const accessTime = DChrono.createDate("2020-01-01");
		const modifiedTime = DChrono.createDate("2020-01-02");

		const result = await DServerFile.setTime(DCommon.infer("/tmp/mock"), {
			accessTime,
			modifiedTime,
		});

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.utimes).toHaveBeenCalledWith(
			"/tmp/mock",
			DChrono.toTimestamp(accessTime),
			DChrono.toTimestamp(modifiedTime),
		);
	});

	it("returns fail when NODE setTime rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			utimes: vi.fn().mockRejectedValue(new Error("boom")),
		});
		const accessTime = DChrono.now();
		const modifiedTime = DChrono.now();

		const result = await DServerFile.setTime(DCommon.infer("/tmp/mock"), {
			accessTime,
			modifiedTime,
		});

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("sets time in DENO env", async() => {
		setEnvironment("DENO");
		const utime = vi.fn().mockResolvedValue(undefined);
		setDenoMock({ utime });
		const accessTime = DChrono.createDateOrThrow(1704067200000);
		const modifiedTime = DChrono.createDateOrThrow(1704153600000);

		const result = await DServerFile.setTime(DCommon.infer("/tmp/mock"), {
			accessTime,
			modifiedTime,
		});

		expect(DEither.isRight(result)).toBe(true);
		expect(utime).toHaveBeenCalledWith(
			"/tmp/mock",
			DChrono.toTimestamp(accessTime),
			DChrono.toTimestamp(modifiedTime),
		);
	});

	it("returns fail when DENO setTime rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			utime: vi.fn().mockRejectedValue(new Error("boom")),
		});
		const accessTime = DChrono.now();
		const modifiedTime = DChrono.now();

		const result = await DServerFile.setTime(DCommon.infer("/tmp/mock"), {
			accessTime,
			modifiedTime,
		});

		expect(DEither.isLeft(result)).toBe(true);
	});
});
