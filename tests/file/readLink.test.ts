import { E, unwrap } from "@duplojs/utils";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "tests/_utils/fsPromises.mock";
import { setDenoMock } from "tests/_utils/deno.mock";

describe("readLink", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("reads link in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			readlink: vi.fn().mockResolvedValue("/tmp/target"),
		});

		const result = await DServerFile.readLink("/tmp/link");

		expect(E.isRight(result)).toBe(true);
		expect(fs.readlink).toHaveBeenCalledWith("/tmp/link", { encoding: "utf-8" });
		if (E.isRight(result)) {
			expect(unwrap(result)).toBe("/tmp/target");
		}
	});

	it("returns fail when NODE readLink rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			readlink: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.readLink("/tmp/link");

		expect(E.isLeft(result)).toBe(true);
	});

	it("reads link in DENO env", async() => {
		setEnvironment("DENO");
		const readLink = vi.fn().mockResolvedValue("/tmp/deno-target");
		setDenoMock({ readLink });

		const result = await DServerFile.readLink("/tmp/link");

		expect(E.isRight(result)).toBe(true);
		expect(readLink).toHaveBeenCalledWith("/tmp/link");
	});

	it("returns fail when DENO readLink rejects", async() => {
		setEnvironment("DENO");
		setDenoMock({
			readLink: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.readLink("/tmp/link");

		expect(E.isLeft(result)).toBe(true);
	});
});
