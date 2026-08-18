import { E, unwrap } from "@duplojs/utils";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "../_utils/fsPromises.mock";
import { setDenoMock } from "../_utils/deno.mock";

describe("realPath", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("returns real path in NODE env", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			realpath: vi.fn().mockResolvedValue("/real/path"),
		});

		const result = await DServerFile.realPath("/tmp/mock");

		expect(E.isRight(result)).toBe(true);
		if (E.isRight(result)) {
			expect(unwrap(result)).toBe("/real/path");
		}
	});

	it("returns fail in NODE env when realpath rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			realpath: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.realPath("/tmp/mock");

		expect(E.isLeft(result)).toBe(true);
	});

	it("returns real path in DENO env", async() => {
		setEnvironment("DENO");
		setDenoMock({
			realPath: vi.fn().mockResolvedValue("/deno/real"),
		});

		const result = await DServerFile.realPath("/tmp/mock");

		expect(E.isRight(result)).toBe(true);
		if (E.isRight(result)) {
			expect(unwrap(result)).toBe("/deno/real");
		}
	});

	it("returns fail in DENO env when realPath rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			realPath: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.realPath("/tmp/mock");

		expect(E.isLeft(result)).toBe(true);
	});
});
