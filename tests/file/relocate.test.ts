import { E, unwrap } from "@duplojs/utils";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "tests/_utils/fsPromises.mock";
import { setDenoMock } from "tests/_utils/deno.mock";

describe("relocate", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("relocates entry in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			rename: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.relocate("/tmp/file.txt", "/new/parent");

		expect(E.isRight(result)).toBe(true);
		expect(fs.rename).toHaveBeenCalledWith("/tmp/file.txt", "/new/parent/file.txt");
		if (E.isRight(result)) {
			expect(unwrap(result)).toBe("/new/parent/file.txt");
		}
	});

	it("returns fail when NODE relocate receives invalid path", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			rename: vi.fn(),
		});

		const result = await DServerFile.relocate("/tmp/", "/new/parent");

		expect(E.isLeft(result)).toBe(true);
		expect(fs.rename).not.toHaveBeenCalled();
	});

	it("returns fail when NODE relocate rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			rename: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.relocate("/tmp/file.txt", "/new/parent");

		expect(E.isLeft(result)).toBe(true);
	});

	it("relocates entry in DENO env", async() => {
		setEnvironment("DENO");
		const rename = vi.fn().mockResolvedValue(undefined);
		setDenoMock({ rename });

		const result = await DServerFile.relocate("/tmp/file.txt", "/new/parent");

		expect(E.isRight(result)).toBe(true);
		expect(rename).toHaveBeenCalledWith("/tmp/file.txt", "/new/parent/file.txt");
		if (E.isRight(result)) {
			expect(unwrap(result)).toBe("/new/parent/file.txt");
		}
	});

	it("returns fail when DENO relocate receives invalid path", async() => {
		setEnvironment("DENO");
		const rename = vi.fn();
		setDenoMock({ rename });

		const result = await DServerFile.relocate("/tmp/", "/new/parent");

		expect(E.isLeft(result)).toBe(true);
		expect(rename).not.toHaveBeenCalled();
	});

	it("returns fail when DENO relocate rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			rename: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.relocate("/tmp/file.txt", "/new/parent");

		expect(E.isLeft(result)).toBe(true);
	});
});
