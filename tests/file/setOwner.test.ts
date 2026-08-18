import { E } from "@duplojs/utils";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "tests/_utils/fsPromises.mock";
import { setDenoMock } from "tests/_utils/deno.mock";

describe("setOwner", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("sets owner in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			chown: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.setOwner("/tmp/mock", {
			userId: 1,
			groupId: 2,
		});

		expect(E.isRight(result)).toBe(true);
		expect(fs.chown).toHaveBeenCalledWith("/tmp/mock", 1, 2);
	});

	it("returns fail when NODE setOwner rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			chown: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.setOwner("/tmp/mock", {
			userId: 1,
			groupId: 2,
		});

		expect(E.isLeft(result)).toBe(true);
	});

	it("sets owner in DENO env", async() => {
		setEnvironment("DENO");
		const chown = vi.fn().mockResolvedValue(undefined);
		setDenoMock({ chown });

		const result = await DServerFile.setOwner("/tmp/mock", {
			userId: 3,
			groupId: 4,
		});

		expect(E.isRight(result)).toBe(true);
		expect(chown).toHaveBeenCalledWith("/tmp/mock", 3, 4);
	});

	it("returns fail when DENO setOwner rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			chown: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.setOwner("/tmp/mock", {
			userId: 3,
			groupId: 4,
		});

		expect(E.isLeft(result)).toBe(true);
	});
});
