import { E, unwrap } from "@duplojs/utils";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "tests/_utils/fsPromises.mock";
import { setDenoMock } from "tests/_utils/deno.mock";
import { setBunMock } from "tests/_utils/bun.mock";

describe("readJsonFile", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("reads json file in NODE env", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			readFile: vi.fn().mockResolvedValue("{\"acc\":1}"),
		});

		const result = await DServerFile.readJsonFile<{ a: number }>("/tmp/mock.json");

		expect(E.isRight(result)).toBe(true);
		if (E.isRight(result)) {
			expect(unwrap(result)).toEqual({ acc: 1 });
		}
	});

	it("returns fail when NODE JSON parse throws", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			readFile: vi.fn().mockResolvedValue("{bad"),
		});

		const result = await DServerFile.readJsonFile("/tmp/mock.json");

		expect(E.isLeft(result)).toBe(true);
	});

	it("returns fail when DENO JSON parse throws", async() => {
		setEnvironment("DENO");
		setDenoMock({
			readTextFile: vi.fn().mockResolvedValue("{bad"),
		});

		const result = await DServerFile.readJsonFile("/tmp/mock.json");

		expect(E.isLeft(result)).toBe(true);
	});

	it("reads json file in DENO env", async() => {
		setEnvironment("DENO");
		setDenoMock({
			readTextFile: vi.fn().mockResolvedValue("{\"b\":2}"),
		});

		const result = await DServerFile.readJsonFile<{ b: number }>("/tmp/mock.json");

		expect(E.isRight(result)).toBe(true);
	});

	it("reads json file in BUN env", async() => {
		setEnvironment("BUN");
		setBunMock({
			file: vi.fn().mockReturnValue({
				text: vi.fn().mockResolvedValue("{\"c\":3}"),
			}),
		});

		const result = await DServerFile.readJsonFile<{ c: number }>("/tmp/mock.json");

		expect(E.isRight(result)).toBe(true);
	});

	it("returns fail when BUN readJsonFile rejects", async() => {
		setEnvironment("BUN");
		setBunMock({
			file: vi.fn().mockReturnValue({
				text: vi.fn().mockRejectedValue(new Error("boom")),
			}),
		});

		const result = await DServerFile.readJsonFile("/tmp/mock.json");

		expect(E.isLeft(result)).toBe(true);
	});
});
