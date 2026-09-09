import * as DEither from "@duplojs/lang/either";
import * as DCommon from "@duplojs/lang/common";
import type * as DPath from "@duplojs/lang/path";
import { setCurrentWorkingDirectory, setEnvironment } from "@scripts";
import { setDenoMock } from "@tests/_utils/deno.mock";
import { setProcessMock } from "@tests/_utils/process.mock";

describe("setCurrentWorkingDirectory", () => {
	afterEach(() => {
		setEnvironment("NODE");
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	it("sets current working directory in NODE env", () => {
		setEnvironment("NODE");
		const chdir = vi.fn();
		setProcessMock({ chdir });

		const result = setCurrentWorkingDirectory<string & DPath.Path>(DCommon.infer("/tmp/project"));

		expect(DEither.isRight(result)).toBe(true);
		expect(chdir).toHaveBeenCalledWith("/tmp/project");
	});

	it("returns fail when NODE chdir throws", () => {
		setEnvironment("NODE");
		setProcessMock({
			chdir: () => {
				throw new Error("boom");
			},
		});

		const result = setCurrentWorkingDirectory<string & DPath.Path>(DCommon.infer("/tmp/project"));

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("sets current working directory in DENO env", () => {
		setEnvironment("DENO");
		const chdir = vi.fn();
		setDenoMock({ chdir });

		const result = setCurrentWorkingDirectory<string & DPath.Path>(DCommon.infer("/tmp/project"));

		expect(DEither.isRight(result)).toBe(true);
		expect(chdir).toHaveBeenCalledWith("/tmp/project");
	});

	it("returns fail when DENO chdir throws", () => {
		setEnvironment("DENO");
		setDenoMock({
			chdir: () => {
				throw new Error("boom");
			},
		});

		const result = setCurrentWorkingDirectory<string & DPath.Path>(DCommon.infer("/tmp/project"));

		expect(DEither.isLeft(result)).toBe(true);
	});
});
