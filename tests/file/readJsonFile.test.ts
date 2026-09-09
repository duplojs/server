import * as DEither from "@duplojs/lang/either";
import * as DCommon from "@duplojs/lang/common";
import type * as DPath from "@duplojs/lang/path";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";
import { setDenoMock } from "@tests/_utils/deno.mock";
import { setBunMock } from "@tests/_utils/bun.mock";

describe("readJsonFile", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("reads json file in NODE env", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			readFile: vi.fn().mockResolvedValue("{\"count\":1}"),
		});

		const result = await DServerFile.readJsonFile<string & DPath.Path>(DCommon.infer("/tmp/mock.json"));

		expect(DEither.isRight(result)).toBe(true);
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result)).toEqual({ count: 1 });
		}
	});

	it("returns fail when NODE JSON parse throws", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			readFile: vi.fn().mockResolvedValue("{bad"),
		});

		const result = await DServerFile.readJsonFile<string & DPath.Path>(DCommon.infer("/tmp/mock.json"));

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("returns fail when DENO JSON parse throws", async() => {
		setEnvironment("DENO");
		setDenoMock({
			readTextFile: vi.fn().mockResolvedValue("{bad"),
		});

		const result = await DServerFile.readJsonFile<string & DPath.Path>(DCommon.infer("/tmp/mock.json"));

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("reads json file in DENO env", async() => {
		setEnvironment("DENO");
		setDenoMock({
			readTextFile: vi.fn().mockResolvedValue("{\"value\":2}"),
		});

		const result = await DServerFile.readJsonFile<string & DPath.Path>(DCommon.infer("/tmp/mock.json"));

		expect(DEither.isRight(result)).toBe(true);
	});

	it("reads json file in BUN env", async() => {
		setEnvironment("BUN");
		setBunMock({
			file: vi.fn().mockReturnValue({
				text: vi.fn().mockResolvedValue("{\"value\":3}"),
			}),
		});

		const result = await DServerFile.readJsonFile<string & DPath.Path>(DCommon.infer("/tmp/mock.json"));

		expect(DEither.isRight(result)).toBe(true);
	});

	it("returns fail when BUN readJsonFile rejects", async() => {
		setEnvironment("BUN");
		setBunMock({
			file: vi.fn().mockReturnValue({
				text: vi.fn().mockRejectedValue(new Error("boom")),
			}),
		});

		const result = await DServerFile.readJsonFile<string & DPath.Path>(DCommon.infer("/tmp/mock.json"));

		expect(DEither.isLeft(result)).toBe(true);
	});
});
