import * as DEither from "@duplojs/lang/either";
import * as DCommon from "@duplojs/lang/common";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";
import { setDenoMock } from "@tests/_utils/deno.mock";

describe("relocate", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("relocates entry in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			rename: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.relocate(DCommon.infer("/tmp/file.txt"), DCommon.infer("/new/parent"));

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.rename).toHaveBeenCalledWith("/tmp/file.txt", "/new/parent/file.txt");
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result)).toBe("/new/parent/file.txt");
		}
	});

	it("returns fail when NODE relocate rejects", async() => {
		setEnvironment("NODE");
		const error = new Error("boom");
		setFsPromisesMock({
			rename: vi.fn().mockRejectedValue(error),
		});

		const result = await DServerFile.relocate(DCommon.infer("/tmp/file.txt"), DCommon.infer("/new/parent"));

		expect(DEither.isLeft(result)).toBe(true);
		if (DEither.isLeft(result)) {
			expect(DEither.unwrapLeft(result)).toBe(error);
		}
	});

	it("returns fail when NODE source path has no base name", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			rename: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.relocate(DCommon.infer("/"), DCommon.infer("/new/parent"));

		expect(DEither.isLeft(result)).toBe(true);
		expect(fs.rename).not.toHaveBeenCalled();
		if (DEither.isLeft(result)) {
			expect(DEither.unwrapLeft(result)).toBeInstanceOf(Error);
		}
	});

	it("relocates entry in DENO env", async() => {
		setEnvironment("DENO");
		const rename = vi.fn().mockResolvedValue(undefined);
		setDenoMock({ rename });

		const result = await DServerFile.relocate(DCommon.infer("/tmp/file.txt"), DCommon.infer("/new/parent"));

		expect(DEither.isRight(result)).toBe(true);
		expect(rename).toHaveBeenCalledWith("/tmp/file.txt", "/new/parent/file.txt");
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result)).toBe("/new/parent/file.txt");
		}
	});

	it("returns fail when DENO relocate rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			rename: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.relocate(DCommon.infer("/tmp/file.txt"), DCommon.infer("/new/parent"));

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("returns fail when DENO source path has no base name", async() => {
		setEnvironment("DENO");
		const rename = vi.fn().mockResolvedValue(undefined);
		setDenoMock({ rename });

		const result = await DServerFile.relocate(DCommon.infer("/"), DCommon.infer("/new/parent"));

		expect(DEither.isLeft(result)).toBe(true);
		expect(rename).not.toHaveBeenCalled();
		if (DEither.isLeft(result)) {
			expect(DEither.unwrapLeft(result)).toBeInstanceOf(Error);
		}
	});
});
