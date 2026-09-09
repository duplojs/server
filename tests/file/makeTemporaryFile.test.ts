import * as DEither from "@duplojs/lang/either";
import * as DCommon from "@duplojs/lang/common";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";
import { setDenoMock } from "@tests/_utils/deno.mock";
import { setOsMock } from "@tests/_utils/os.mock";
import { setCryptoMock } from "@tests/_utils/crypto.mock";

describe("makeTemporaryFile", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("creates temporary file in NODE env", async() => {
		setEnvironment("NODE");
		setOsMock({ tmpdir: vi.fn().mockReturnValue("/tmp") });
		setCryptoMock({ randomUUID: vi.fn().mockReturnValue("uuid") });
		const fs = setFsPromisesMock({
			open: vi.fn().mockResolvedValue({
				close: vi.fn().mockResolvedValue(undefined),
			}),
		});

		const result = await DServerFile.makeTemporaryFile(DCommon.infer("pre-"), DCommon.cast(".txt"));

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.open).toHaveBeenCalledWith("/tmp/pre-uuid.txt", "wx");
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result)).toBe("/tmp/pre-uuid.txt");
		}
	});

	it("creates temporary file in NODE env without suffix", async() => {
		setEnvironment("NODE");
		setOsMock({ tmpdir: vi.fn().mockReturnValue("/tmp") });
		setCryptoMock({ randomUUID: vi.fn().mockReturnValue("uuid") });
		const fs = setFsPromisesMock({
			open: vi.fn().mockResolvedValue({
				close: vi.fn().mockResolvedValue(undefined),
			}),
		});

		const result = await DServerFile.makeTemporaryFile(DCommon.infer("pre-"));

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.open).toHaveBeenCalledWith("/tmp/pre-uuid", "wx");
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result)).toBe("/tmp/pre-uuid");
		}
	});

	it("returns fail when NODE open rejects", async() => {
		setEnvironment("NODE");
		setOsMock({ tmpdir: vi.fn().mockReturnValue("/tmp") });
		setCryptoMock({ randomUUID: vi.fn().mockReturnValue("uuid") });
		setFsPromisesMock({
			open: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.makeTemporaryFile(DCommon.infer("pre-"), DCommon.cast(".txt"));

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("creates temporary file in DENO env", async() => {
		setEnvironment("DENO");
		const makeTempFile = vi.fn().mockResolvedValue("/tmp/deno-file");
		setDenoMock({ makeTempFile });

		const result = await DServerFile.makeTemporaryFile(DCommon.infer("pre-"), DCommon.cast(".txt"));

		expect(DEither.isRight(result)).toBe(true);
		expect(makeTempFile).toHaveBeenCalledWith({
			prefix: "pre-",
			suffix: ".txt",
		});
	});

	it("returns fail when DENO makeTempFile rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			makeTempFile: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.makeTemporaryFile(DCommon.infer("pre-"), DCommon.cast(".txt"));

		expect(DEither.isLeft(result)).toBe(true);
	});
});
