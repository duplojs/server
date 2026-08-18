import { E, unwrap } from "@duplojs/utils";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "tests/_utils/fsPromises.mock";

describe("readDirectory", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("reads directory in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			readdir: vi.fn().mockResolvedValue(["a", "b"]),
		});

		const result = await DServerFile.readDirectory("/tmp/mock", { recursive: true });

		expect(E.isRight(result)).toBe(true);
		expect(fs.readdir).toHaveBeenCalledWith("/tmp/mock", { recursive: true });
		if (E.isRight(result)) {
			expect(unwrap(result)).toEqual(["a", "b"]);
		}
	});

	it("returns fail when NODE readdir rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			readdir: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.readDirectory("/tmp/mock");

		expect(E.isLeft(result)).toBe(true);
	});
});
