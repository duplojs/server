import { E } from "@duplojs/utils";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "tests/_utils/fsPromises.mock";
import { setDenoMock } from "tests/_utils/deno.mock";

describe("remove", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("removes entry in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			rm: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.remove("/tmp/mock", { recursive: true });

		expect(E.isRight(result)).toBe(true);
		expect(fs.rm).toHaveBeenCalledWith("/tmp/mock", {
			recursive: true,
			force: true,
		});
	});

	it("returns fail when NODE remove rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			rm: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.remove("/tmp/mock");

		expect(E.isLeft(result)).toBe(true);
	});

	it("removes entry in DENO env", async() => {
		setEnvironment("DENO");
		const remove = vi.fn().mockResolvedValue(undefined);
		setDenoMock({ remove });

		const result = await DServerFile.remove("/tmp/mock", { recursive: false });

		expect(E.isRight(result)).toBe(true);
		expect(remove).toHaveBeenCalledWith("/tmp/mock", { recursive: false });
	});

	it("returns fail when DENO remove rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			remove: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.remove("/tmp/mock");

		expect(E.isLeft(result)).toBe(true);
	});
});
