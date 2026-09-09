import * as DEither from "@duplojs/lang/either";
import * as DCommon from "@duplojs/lang/common";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";
import { setDenoMock } from "@tests/_utils/deno.mock";

describe("rename", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("renames file in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			rename: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.rename(DCommon.infer("/tmp/file.txt"), DCommon.infer("new.txt"));

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.rename).toHaveBeenCalledWith("/tmp/file.txt", "/tmp/new.txt");
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result)).toBe("/tmp/new.txt");
		}
	});

	it("returns fail when NODE rename rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			rename: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.rename(DCommon.infer("/tmp/file.txt"), DCommon.infer("new.txt"));

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("returns fail when NODE rename has no parent path", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			rename: vi.fn(),
		});

		const result = await DServerFile.rename(DCommon.infer("/"), DCommon.infer("new.txt"));

		expect(DEither.isLeft(result)).toBe(true);
		expect(fs.rename).not.toHaveBeenCalled();
	});

	it("resolves NODE renamed path from parent and new name", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			rename: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.rename(DCommon.infer("/tmp/file.txt"), DCommon.infer("newname.txt"));

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.rename).toHaveBeenCalledWith("/tmp/file.txt", "/tmp/newname.txt");
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result)).toBe("/tmp/newname.txt");
		}
	});

	it("renames file in DENO env", async() => {
		setEnvironment("DENO");
		const rename = vi.fn().mockResolvedValue(undefined);
		setDenoMock({ rename });

		const result = await DServerFile.rename(DCommon.infer("/tmp/file.txt"), DCommon.infer("new.txt"));

		expect(DEither.isRight(result)).toBe(true);
		expect(rename).toHaveBeenCalledWith("/tmp/file.txt", "/tmp/new.txt");
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result)).toBe("/tmp/new.txt");
		}
	});

	it("returns fail when DENO rename rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			rename: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.rename(DCommon.infer("/tmp/file.txt"), DCommon.infer("new.txt"));

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("returns fail when DENO rename has no parent path", async() => {
		setEnvironment("DENO");
		const rename = vi.fn();
		setDenoMock({ rename });

		const result = await DServerFile.rename(DCommon.infer("/"), DCommon.infer("new.txt"));

		expect(DEither.isLeft(result)).toBe(true);
		expect(rename).not.toHaveBeenCalled();
	});

	it("resolves DENO renamed path from parent and new name", async() => {
		setEnvironment("DENO");
		const rename = vi.fn().mockResolvedValue(undefined);
		setDenoMock({ rename });

		const result = await DServerFile.rename(DCommon.infer("/tmp/file.txt"), DCommon.infer("newname.txt"));

		expect(DEither.isRight(result)).toBe(true);
		expect(rename).toHaveBeenCalledWith("/tmp/file.txt", "/tmp/newname.txt");
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result)).toBe("/tmp/newname.txt");
		}
	});
});
