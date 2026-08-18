import { D, E } from "@duplojs/utils";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "tests/_utils/fsPromises.mock";
import { setDenoMock } from "tests/_utils/deno.mock";

describe("setTime", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("sets time in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			utimes: vi.fn().mockResolvedValue(undefined),
		});
		const accessTime = D.create("2020-01-01");
		const modifiedTime = D.create("2020-01-02");

		const result = await DServerFile.setTime("/tmp/mock", {
			accessTime,
			modifiedTime,
		});

		expect(E.isRight(result)).toBe(true);
		expect(fs.utimes).toHaveBeenCalledWith(
			"/tmp/mock",
			D.toTimestamp(accessTime),
			D.toTimestamp(modifiedTime),
		);
	});

	it("returns fail when NODE setTime rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			utimes: vi.fn().mockRejectedValue(new Error("boom")),
		});
		const accessTime = D.now();
		const modifiedTime = D.now();

		const result = await DServerFile.setTime("/tmp/mock", {
			accessTime,
			modifiedTime,
		});

		expect(E.isLeft(result)).toBe(true);
	});

	it("sets time in DENO env", async() => {
		setEnvironment("DENO");
		const utime = vi.fn().mockResolvedValue(undefined);
		setDenoMock({ utime });
		const accessTime = D.createOrThrow(1704067200000);
		const modifiedTime = D.createOrThrow(1704153600000);

		const result = await DServerFile.setTime("/tmp/mock", {
			accessTime,
			modifiedTime,
		});

		expect(E.isRight(result)).toBe(true);
		expect(utime).toHaveBeenCalledWith(
			"/tmp/mock",
			D.toTimestamp(accessTime),
			D.toTimestamp(modifiedTime),
		);
	});

	it("returns fail when DENO setTime rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			utime: vi.fn().mockRejectedValue(new Error("boom")),
		});
		const accessTime = D.now();
		const modifiedTime = D.now();

		const result = await DServerFile.setTime("/tmp/mock", {
			accessTime,
			modifiedTime,
		});

		expect(E.isLeft(result)).toBe(true);
	});
});
