import * as DEither from "@duplojs/lang/either";
import * as DCommon from "@duplojs/lang/common";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";
import { setDenoMock } from "@tests/_utils/deno.mock";

describe("link", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("creates hard link in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			link: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.link(DCommon.infer("/tmp/existing"), DCommon.infer("/tmp/new"));

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.link).toHaveBeenCalledWith("/tmp/existing", "/tmp/new");
	});

	it("returns fail when NODE link rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			link: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.link(DCommon.infer("/tmp/existing"), DCommon.infer("/tmp/new"));

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("creates hard link in DENO env", async() => {
		setEnvironment("DENO");
		const link = vi.fn().mockResolvedValue(undefined);
		setDenoMock({ link });

		const result = await DServerFile.link(DCommon.infer("/tmp/existing file"), DCommon.infer("/tmp/new file"));

		expect(DEither.isRight(result)).toBe(true);
		expect(link).toHaveBeenCalledWith("/tmp/existing file", "/tmp/new file");
	});

	it("returns fail when DENO link rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			link: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.link(DCommon.infer("/tmp/existing"), DCommon.infer("/tmp/new"));

		expect(DEither.isLeft(result)).toBe(true);
	});
});
