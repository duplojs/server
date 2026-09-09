import * as DCommon from "@duplojs/lang/common";
import type * as DPath from "@duplojs/lang/path";
import { SetCurrentWorkingDirectoryError, setCurrentWorkingDirectoryOrThrow, setEnvironment } from "@scripts";
import { setProcessMock } from "@tests/_utils/process.mock";

describe("setCurrentWorkingDirectoryOrThrow", () => {
	afterEach(() => {
		setEnvironment("NODE");
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	it("returns undefined when working directory is set", () => {
		setEnvironment("NODE");
		setProcessMock({
			chdir: vi.fn(),
		});

		const result = setCurrentWorkingDirectoryOrThrow<string & DPath.Path>(DCommon.infer("/tmp/project"));

		expect(result).toBeUndefined();
	});

	it("throws when working directory cannot be set", () => {
		setEnvironment("NODE");
		setProcessMock({
			chdir: () => {
				throw new Error("boom");
			},
		});

		expect(() => setCurrentWorkingDirectoryOrThrow<string & DPath.Path>(DCommon.infer("/tmp/project")))
			.toThrow(SetCurrentWorkingDirectoryError);
	});
});
