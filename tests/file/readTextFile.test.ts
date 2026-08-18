import { E, unwrap } from "@duplojs/utils";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "../_utils/fsPromises.mock";
import { setDenoMock } from "../_utils/deno.mock";
import { setBunMock } from "../_utils/bun.mock";

describe("readTextFile", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("reads text file in NODE env", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			readFile: vi.fn().mockResolvedValue("hello"),
		});

		const result = await DServerFile.readTextFile("/tmp/mock");

		expect(E.isRight(result)).toBe(true);
		if (E.isRight(result)) {
			expect(unwrap(result)).toBe("hello");
		}
	});

	it("returns fail when NODE readTextFile rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			readFile: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.readTextFile("/tmp/mock");

		expect(E.isLeft(result)).toBe(true);
	});

	it("reads text file in DENO env", async() => {
		setEnvironment("DENO");
		setDenoMock({
			readTextFile: vi.fn().mockResolvedValue("deno"),
		});

		const result = await DServerFile.readTextFile("/tmp/mock");

		expect(E.isRight(result)).toBe(true);
		if (E.isRight(result)) {
			expect(unwrap(result)).toBe("deno");
		}
	});

	it("returns fail when DENO readTextFile rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			readTextFile: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.readTextFile("/tmp/mock");

		expect(E.isLeft(result)).toBe(true);
	});

	it("reads text file in BUN env", async() => {
		setEnvironment("BUN");
		setBunMock({
			file: vi.fn().mockReturnValue({
				text: vi.fn().mockResolvedValue("bun"),
			}),
		});

		const result = await DServerFile.readTextFile("/tmp/mock");

		expect(E.isRight(result)).toBe(true);
		if (E.isRight(result)) {
			expect(unwrap(result)).toBe("bun");
		}
	});

	it("returns fail when BUN readTextFile rejects", async() => {
		setEnvironment("BUN");
		setBunMock({
			file: vi.fn().mockReturnValue({
				text: vi.fn().mockRejectedValue(new Error("boom")),
			}),
		});

		const result = await DServerFile.readTextFile("/tmp/mock");

		expect(E.isLeft(result)).toBe(true);
	});
});
