import { E } from "@duplojs/utils";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "../_utils/fsPromises.mock";
import { setDenoMock } from "../_utils/deno.mock";
import { setBunMock } from "../_utils/bun.mock";

describe("exists", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("returns ok in NODE env when access resolves", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			access: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.exists("/tmp/mock");

		expect(E.isRight(result)).toBe(true);
	});

	it("returns fail in NODE env when access rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			access: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.exists("/tmp/mock");

		expect(E.isLeft(result)).toBe(true);
	});

	it("returns ok in DENO env when stat resolves", async() => {
		setEnvironment("DENO");
		setDenoMock({
			stat: vi.fn().mockResolvedValue({}),
		});

		const result = await DServerFile.exists("/tmp/mock");

		expect(E.isRight(result)).toBe(true);
	});

	it("returns fail in DENO env when stat rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			stat: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.exists("/tmp/mock");

		expect(E.isLeft(result)).toBe(true);
	});

	it("returns ok in BUN env when file exists", async() => {
		setEnvironment("BUN");
		setBunMock({
			file: vi.fn().mockReturnValue({
				exists: vi.fn().mockResolvedValue(true),
			}),
		});

		const result = await DServerFile.exists("/tmp/mock");

		expect(E.isRight(result)).toBe(true);
	});

	it("returns fail in BUN env when file does not exist", async() => {
		setEnvironment("BUN");
		setBunMock({
			file: vi.fn().mockReturnValue({
				exists: vi.fn().mockResolvedValue(false),
			}),
		});

		const result = await DServerFile.exists("/tmp/mock");

		expect(E.isLeft(result)).toBe(true);
	});

	it("returns fail in BUN env when exists throws", async() => {
		setEnvironment("BUN");
		setBunMock({
			file: vi.fn().mockReturnValue({
				exists: vi.fn().mockRejectedValue(new Error("boom")),
			}),
		});

		const result = await DServerFile.exists("/tmp/mock");

		expect(E.isLeft(result)).toBe(true);
	});
});
