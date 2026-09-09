import * as DEither from "@duplojs/lang/either";
import * as DCommon from "@duplojs/lang/common";
import { DServerFile, setEnvironment } from "@scripts";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";

describe("copy", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("copies entry in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			cp: vi.fn().mockResolvedValue(undefined),
		});

		const result = await DServerFile.copy(DCommon.infer("/tmp/from"), DCommon.infer("/tmp/to"));

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.cp).toHaveBeenCalledWith("/tmp/from", "/tmp/to", { recursive: true });
	});

	it("returns fail when NODE copy rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			cp: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.copy(DCommon.infer("/tmp/from"), DCommon.infer("/tmp/to"));

		expect(DEither.isLeft(result)).toBe(true);
	});
});
