import { E } from "@duplojs/utils";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "tests/_utils/fsPromises.mock";
import { setDenoMock } from "tests/_utils/deno.mock";
import { setBunMock } from "tests/_utils/bun.mock";

describe("writeJsonFile", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("writes json file in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			writeFile: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.writeJsonFile("/tmp/mock.json", { first: 1 }, { space: 2 });

		expect(E.isRight(result)).toBe(true);
		expect(fs.writeFile).toHaveBeenCalledWith(
			"/tmp/mock.json",
			JSON.stringify({ first: 1 }, null, 2),
			{ encoding: "utf-8" },
		);
	});

	it("returns fail when NODE writeJsonFile rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			writeFile: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.writeJsonFile("/tmp/mock.json", { first: 1 });

		expect(E.isLeft(result)).toBe(true);
	});

	it("writes json file in DENO env", async() => {
		setEnvironment("DENO");
		const spy = vi.fn().mockResolvedValue(undefined);
		setDenoMock({
			writeTextFile: spy,
		});

		const result = await DServerFile.writeJsonFile("/tmp/mock.json", { second: 2 });

		expect(E.isRight(result)).toBe(true);
		expect(spy).toHaveBeenCalledWith("/tmp/mock.json", JSON.stringify({ second: 2 }));
	});

	it("returns fail when DENO writeJsonFile rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			writeTextFile: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.writeJsonFile("/tmp/mock.json", { second: 2 });

		expect(E.isLeft(result)).toBe(true);
	});

	it("writes json file in BUN env", async() => {
		setEnvironment("BUN");
		const writeSpy = vi.fn().mockResolvedValue(undefined);
		setBunMock({
			file: vi.fn().mockReturnValue({ write: writeSpy }),
		});

		const result = await DServerFile.writeJsonFile("/tmp/mock.json", { three: 3 });

		expect(E.isRight(result)).toBe(true);
		expect(writeSpy).toHaveBeenCalledWith(JSON.stringify({ three: 3 }));
	});

	it("returns fail when BUN writeJsonFile rejects", async() => {
		setEnvironment("BUN");
		setBunMock({
			file: vi.fn().mockReturnValue({
				write: vi.fn().mockRejectedValue(new Error("boom")),
			}),
		});

		const result = await DServerFile.writeJsonFile("/tmp/mock.json", { three: 3 });

		expect(E.isLeft(result)).toBe(true);
	});

	it("returns fail when JSON stringify throws", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			writeFile: vi.fn(),
		});
		const circular: { self?: unknown } = {};
		circular.self = circular;

		const result = await DServerFile.writeJsonFile("/tmp/mock.json", circular);

		expect(E.isLeft(result)).toBe(true);
		expect(fs.writeFile).not.toHaveBeenCalled();
	});

	it("returns fail when JSON stringify throws in DENO env", async() => {
		setEnvironment("DENO");
		const spy = vi.fn();
		setDenoMock({
			writeTextFile: spy,
		});
		const circular: { self?: unknown } = {};
		circular.self = circular;

		const result = await DServerFile.writeJsonFile("/tmp/mock.json", circular);

		expect(E.isLeft(result)).toBe(true);
		expect(spy).not.toHaveBeenCalled();
	});

	it("returns fail when JSON stringify throws in BUN env", async() => {
		setEnvironment("BUN");
		const writeSpy = vi.fn();
		const fileSpy = vi.fn().mockReturnValue({ write: writeSpy });
		setBunMock({
			file: fileSpy,
		});
		const circular: { self?: unknown } = {};
		circular.self = circular;

		const result = await DServerFile.writeJsonFile("/tmp/mock.json", circular);

		expect(E.isLeft(result)).toBe(true);
		expect(fileSpy).not.toHaveBeenCalled();
		expect(writeSpy).not.toHaveBeenCalled();
	});
});
