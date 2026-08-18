import { E } from "@duplojs/utils";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "tests/_utils/fsPromises.mock";
import { setDenoMock } from "tests/_utils/deno.mock";

describe("link", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("creates hard link in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			link: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.link("/tmp/existing", "/tmp/new");

		expect(E.isRight(result)).toBe(true);
		expect(fs.link).toHaveBeenCalledWith("/tmp/existing", "/tmp/new");
	});

	it("returns fail when NODE link rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			link: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.link("/tmp/existing", "/tmp/new");

		expect(E.isLeft(result)).toBe(true);
	});

	it("creates hard link in DENO env", async() => {
		setEnvironment("DENO");
		const link = vi.fn().mockResolvedValue(undefined);
		setDenoMock({ link });

		const result = await DServerFile.link("/tmp/existing file", "/tmp/new file");

		expect(E.isRight(result)).toBe(true);
		expect(link).toHaveBeenCalledWith("/tmp/existing file", "/tmp/new file");
	});

	it("returns fail when DENO link rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			link: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.link("/tmp/existing", "/tmp/new");

		expect(E.isLeft(result)).toBe(true);
	});
});
