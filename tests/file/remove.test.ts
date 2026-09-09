import * as DEither from "@duplojs/lang/either";
import * as DCommon from "@duplojs/lang/common";
import { DServerFile, setEnvironment } from "@scripts";
import type * as DPath from "@duplojs/lang/path";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";
import { setDenoMock } from "@tests/_utils/deno.mock";

describe("remove", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("removes entry in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			rm: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.remove<string & DPath.Path>(DCommon.infer("/tmp/mock"), { recursive: true });

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.rm).toHaveBeenCalledWith("/tmp/mock", {
			recursive: true,
			force: true,
		});
	});

	it("returns fail when NODE remove rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			rm: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.remove<string & DPath.Path>(DCommon.infer("/tmp/mock"));

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("removes entry in DENO env", async() => {
		setEnvironment("DENO");
		const remove = vi.fn().mockResolvedValue(undefined);
		setDenoMock({ remove });

		const result = await DServerFile.remove<string & DPath.Path>(DCommon.infer("/tmp/mock"), { recursive: false });

		expect(DEither.isRight(result)).toBe(true);
		expect(remove).toHaveBeenCalledWith("/tmp/mock", { recursive: false });
	});

	it("returns fail when DENO remove rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			remove: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.remove<string & DPath.Path>(DCommon.infer("/tmp/mock"));

		expect(DEither.isLeft(result)).toBe(true);
	});
});
