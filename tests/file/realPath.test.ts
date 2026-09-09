import * as DEither from "@duplojs/lang/either";
import * as DCommon from "@duplojs/lang/common";
import { DServerFile, setEnvironment } from "@scripts";
import type * as DPath from "@duplojs/lang/path";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";
import { setDenoMock } from "@tests/_utils/deno.mock";

describe("realPath", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("returns real path in NODE env", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			realpath: vi.fn().mockResolvedValue("/real/path"),
		});

		const result = await DServerFile.realPath<string & DPath.Path>(DCommon.infer("/tmp/mock"));

		expect(DEither.isRight(result)).toBe(true);
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result)).toBe("/real/path");
		}
	});

	it("returns fail in NODE env when realpath rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			realpath: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.realPath<string & DPath.Path>(DCommon.infer("/tmp/mock"));

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("returns real path in DENO env", async() => {
		setEnvironment("DENO");
		setDenoMock({
			realPath: vi.fn().mockResolvedValue("/deno/real"),
		});

		const result = await DServerFile.realPath<string & DPath.Path>(DCommon.infer("/tmp/mock"));

		expect(DEither.isRight(result)).toBe(true);
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result)).toBe("/deno/real");
		}
	});

	it("returns fail in DENO env when realPath rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			realPath: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.realPath<string & DPath.Path>(DCommon.infer("/tmp/mock"));

		expect(DEither.isLeft(result)).toBe(true);
	});
});
