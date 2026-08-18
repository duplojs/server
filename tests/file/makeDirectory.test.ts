import { E } from "@duplojs/utils";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "tests/_utils/fsPromises.mock";
import { setDenoMock } from "tests/_utils/deno.mock";

describe("makeDirectory", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("creates directory in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			mkdir: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.makeDirectory("/tmp/mock", { recursive: true });

		expect(E.isRight(result)).toBe(true);
		expect(fs.mkdir).toHaveBeenCalledWith("/tmp/mock", { recursive: true });
	});

	it("returns fail when NODE mkdir rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			mkdir: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.makeDirectory("/tmp/mock");

		expect(E.isLeft(result)).toBe(true);
	});

	it("creates directory in DENO env", async() => {
		setEnvironment("DENO");
		const mkdir = vi.fn().mockResolvedValue(undefined);
		setDenoMock({ mkdir });

		const result = await DServerFile.makeDirectory("/tmp/mock", { recursive: false });

		expect(E.isRight(result)).toBe(true);
		expect(mkdir).toHaveBeenCalledWith("/tmp/mock", { recursive: false });
	});

	it("returns fail when DENO mkdir rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			mkdir: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.makeDirectory("/tmp/mock");

		expect(E.isLeft(result)).toBe(true);
	});
});
