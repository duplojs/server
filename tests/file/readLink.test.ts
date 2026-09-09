import * as DEither from "@duplojs/lang/either";
import * as DCommon from "@duplojs/lang/common";
import type * as DPath from "@duplojs/lang/path";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";
import { setDenoMock } from "@tests/_utils/deno.mock";

describe("readLink", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("reads link in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			readlink: vi.fn().mockResolvedValue("/tmp/target"),
		});

		const result = await DServerFile.readLink<string & DPath.Path>(DCommon.infer("/tmp/link"));

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.readlink).toHaveBeenCalledWith("/tmp/link", { encoding: "utf-8" });
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result)).toBe("/tmp/target");
		}
	});

	it("returns fail when NODE readLink rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			readlink: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.readLink<string & DPath.Path>(DCommon.infer("/tmp/link"));

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("reads link in DENO env", async() => {
		setEnvironment("DENO");
		const readLink = vi.fn().mockResolvedValue("/tmp/deno-target");
		setDenoMock({ readLink });

		const result = await DServerFile.readLink<string & DPath.Path>(DCommon.infer("/tmp/link"));

		expect(DEither.isRight(result)).toBe(true);
		expect(readLink).toHaveBeenCalledWith("/tmp/link");
	});

	it("returns fail when DENO readLink rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			readLink: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.readLink<string & DPath.Path>(DCommon.infer("/tmp/link"));

		expect(DEither.isLeft(result)).toBe(true);
	});
});
