import * as DEither from "@duplojs/lang/either";
import * as DCommon from "@duplojs/lang/common";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";
import { setDenoMock } from "@tests/_utils/deno.mock";
import { setBunMock } from "@tests/_utils/bun.mock";

describe("writeFile", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("writes file in NODE env", async() => {
		setEnvironment("NODE");
		const data = new Uint8Array([1]);
		const fs = setFsPromisesMock({
			writeFile: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.writeFile(DCommon.infer("/tmp/mock"), data);

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.writeFile).toHaveBeenCalledWith("/tmp/mock", data);
	});

	it("returns fail when NODE writeFile rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			writeFile: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.writeFile(DCommon.infer("/tmp/mock"), new Uint8Array([1]));

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("writes file in DENO env", async() => {
		setEnvironment("DENO");
		const spy = vi.fn().mockResolvedValue(undefined);
		setDenoMock({
			writeFile: spy,
		});

		const data = new Uint8Array([2]);
		const result = await DServerFile.writeFile(DCommon.infer("/tmp/mock"), data);

		expect(DEither.isRight(result)).toBe(true);
		expect(spy).toHaveBeenCalledWith("/tmp/mock", data);
	});

	it("returns fail when DENO writeFile rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			writeFile: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.writeFile(DCommon.infer("/tmp/mock"), new Uint8Array([3]));

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("writes file in BUN env", async() => {
		setEnvironment("BUN");
		const writeSpy = vi.fn().mockResolvedValue(undefined);
		setBunMock({
			file: vi.fn().mockReturnValue({ write: writeSpy }),
		});

		const data = new Uint8Array([4]);
		const result = await DServerFile.writeFile(DCommon.infer("/tmp/mock"), data);

		expect(DEither.isRight(result)).toBe(true);
		expect(writeSpy).toHaveBeenCalledWith(data);
	});

	it("returns fail when BUN writeFile rejects", async() => {
		setEnvironment("BUN");
		setBunMock({
			file: vi.fn().mockReturnValue({
				write: vi.fn().mockRejectedValue(new Error("boom")),
			}),
		});

		const result = await DServerFile.writeFile(DCommon.infer("/tmp/mock"), new Uint8Array([5]));

		expect(DEither.isLeft(result)).toBe(true);
	});
});
