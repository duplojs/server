import * as DEither from "@duplojs/lang/either";
import * as DCommon from "@duplojs/lang/common";
import { DServerFile, setEnvironment } from "@scripts";
import type * as DPath from "@duplojs/lang/path";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";

describe("readDirectory", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("reads directory in NODE env", async() => {
		setEnvironment("NODE");
		const fs = setFsPromisesMock({
			readdir: vi.fn().mockResolvedValue(["a", "b"]),
		});

		const result = await DServerFile.readDirectory<string & DPath.Path>(DCommon.infer("/tmp/mock"), { recursive: true });

		expect(DEither.isRight(result)).toBe(true);
		expect(fs.readdir).toHaveBeenCalledWith("/tmp/mock", { recursive: true });
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result)).toEqual(["a", "b"]);
		}
	});

	it("returns fail when NODE readdir rejects", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			readdir: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await DServerFile.readDirectory<string & DPath.Path>(DCommon.infer("/tmp/mock"));

		expect(DEither.isLeft(result)).toBe(true);
	});
});
