import * as DEither from "@duplojs/lang/either";
import * as DCommon from "@duplojs/lang/common";
import { DServerFile, setEnvironment } from "@scripts";
import type * as DPath from "@duplojs/lang/path";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";
import { setDenoMock } from "@tests/_utils/deno.mock";
import { setBunMock } from "@tests/_utils/bun.mock";

describe("readFile", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("reads file in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
		});

		const result = await DServerFile.readFile<string & DPath.Path>(DCommon.infer("/tmp/mock"));

		expect(DEither.isRight(result)).toBe(true);
		if (DEither.isRight(result)) {
			expect(Array.from(DEither.unwrapRight(result))).toEqual([1, 2, 3]);
		}
	});

	it("returns fail when NODE readFile rejects", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			readFile: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.readFile<string & DPath.Path>(DCommon.infer("/tmp/mock"));

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("reads file in DENO env", async() => {
		setEnvironment("DENO");
		setDenoMock({
			readFile: vi.fn().mockResolvedValue(new Uint8Array([4, 5])),
		});

		const result = await DServerFile.readFile<string & DPath.Path>(DCommon.infer("/tmp/mock"));

		expect(DEither.isRight(result)).toBe(true);
		if (DEither.isRight(result)) {
			expect(Array.from(DEither.unwrapRight(result))).toEqual([4, 5]);
		}
	});

	it("returns fail when DENO readFile rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			readFile: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.readFile<string & DPath.Path>(DCommon.infer("/tmp/mock"));

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("reads file in BUN env", async() => {
		setEnvironment("BUN");
		setBunMock({
			file: vi.fn().mockReturnValue({
				bytes: vi.fn().mockResolvedValue(new Uint8Array([7])),
			}),
		});

		const result = await DServerFile.readFile<string & DPath.Path>(DCommon.infer("/tmp/mock"));

		expect(DEither.isRight(result)).toBe(true);
		if (DEither.isRight(result)) {
			expect(Array.from(DEither.unwrapRight(result))).toEqual([7]);
		}
	});

	it("returns fail when BUN readFile rejects", async() => {
		setEnvironment("BUN");
		setBunMock({
			file: vi.fn().mockReturnValue({
				bytes: vi.fn().mockRejectedValue(new Error("boom")),
			}),
		});

		const result = await DServerFile.readFile<string & DPath.Path>(DCommon.infer("/tmp/mock"));

		expect(DEither.isLeft(result)).toBe(true);
	});
});
