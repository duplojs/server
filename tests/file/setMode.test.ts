import * as DEither from "@duplojs/lang/either";
import * as DCommon from "@duplojs/lang/common";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";
import { setDenoMock } from "@tests/_utils/deno.mock";

describe("setMode", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("sets mode in NODE env with mode object", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			chmod: vi.fn().mockResolvedValue(undefined),
		});

		const mode = {
			user: {
				read: true,
				write: true,
				exec: true,
			},
			group: { read: true },
			other: {
				read: true,
				exec: true,
			},
			setUserId: true,
			sticky: true,
		};

		const result = await DServerFile.setMode(DCommon.infer("/tmp/mock"), mode);

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.chmod).toHaveBeenCalledWith("/tmp/mock", 3045);
	});

	it("returns fail when NODE setMode rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			chmod: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.setMode(DCommon.infer("/tmp/mock"), 0o755);

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("sets mode in NODE env with empty mode object", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			chmod: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.setMode(DCommon.infer("/tmp/mock"), {});

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.chmod).toHaveBeenCalledWith("/tmp/mock", 0);
	});

	it("sets mode in NODE env with group special bit and no read permission", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			chmod: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.setMode(DCommon.infer("/tmp/mock"), {
			group: { write: true },
			setGroupId: true,
		});

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.chmod).toHaveBeenCalledWith("/tmp/mock", 1040);
	});

	it("sets mode in DENO env with numeric mode", async() => {
		setEnvironment("DENO");
		const chmod = vi.fn().mockResolvedValue(undefined);
		setDenoMock({ chmod });

		const result = await DServerFile.setMode(DCommon.infer("/tmp/mock"), 0o644);

		expect(DEither.isRight(result)).toBe(true);
		expect(chmod).toHaveBeenCalledWith("/tmp/mock", 0o644);
	});

	it("returns fail when DENO setMode rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			chmod: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.setMode(DCommon.infer("/tmp/mock"), 0o644);

		expect(DEither.isLeft(result)).toBe(true);
	});
});
