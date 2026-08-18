import { E } from "@duplojs/utils";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "tests/_utils/fsPromises.mock";
import { setDenoMock } from "tests/_utils/deno.mock";

describe("symlink", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("creates symlink in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			symlink: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.symlink("/tmp/old", "/tmp/new", { type: "file" });

		expect(E.isRight(result)).toBe(true);
		expect(fs.symlink).toHaveBeenCalledWith("/tmp/old", "/tmp/new", "file");
	});

	it("returns fail when NODE symlink rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			symlink: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.symlink("/tmp/old", "/tmp/new");

		expect(E.isLeft(result)).toBe(true);
	});

	it("creates symlink in DENO env", async() => {
		setEnvironment("DENO");
		const symlink = vi.fn().mockResolvedValue(undefined);
		setDenoMock({ symlink });

		const result = await DServerFile.symlink("/tmp/old", "/tmp/new", { type: "dir" });

		expect(E.isRight(result)).toBe(true);
		expect(symlink).toHaveBeenCalledWith("/tmp/old", "/tmp/new", { type: "dir" });
	});

	it("returns fail when DENO symlink rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			symlink: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.symlink("/tmp/old", "/tmp/new");

		expect(E.isLeft(result)).toBe(true);
	});
});
