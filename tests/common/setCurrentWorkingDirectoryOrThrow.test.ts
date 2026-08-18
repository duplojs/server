import { type ExpectType, pipe } from "@duplojs/utils";
import { setCurrentWorkingDirectoryOrThrow, SetCurrentWorkingDirectoryError, setEnvironment } from "@scripts";
import { setDenoMock } from "tests/_utils/deno.mock";
import { setProcessMock } from "tests/_utils/process.mock";

describe("setCurrentWorkingDirectoryOrThrow", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("changes current working directory in NODE env", () => {
		setEnvironment("NODE");
		const chdirSpy = vi.fn();
		setProcessMock({ chdir: chdirSpy });

		setCurrentWorkingDirectoryOrThrow("/tmp/mock-cwd");
		expect(chdirSpy).toHaveBeenCalledWith("/tmp/mock-cwd");
	});

	it("throws SetCurrentWorkingDirectoryError when process.chdir fails in NODE env", () => {
		setEnvironment("NODE");
		setProcessMock({
			chdir: () => {
				throw new Error("boom");
			},
		});

		expect(() => {
			setCurrentWorkingDirectoryOrThrow("/tmp/mock-cwd");
		}).toThrow(SetCurrentWorkingDirectoryError);
	});

	it("changes current working directory in DENO env", () => {
		setEnvironment("DENO");
		const chdirSpy = vi.fn();
		setDenoMock({
			chdir: chdirSpy,
		});

		setCurrentWorkingDirectoryOrThrow("/tmp/mock-deno-cwd");
		expect(chdirSpy).toHaveBeenCalledWith("/tmp/mock-deno-cwd");
	});

	it("throws SetCurrentWorkingDirectoryError when Deno.chdir fails in DENO env", () => {
		setEnvironment("DENO");
		setDenoMock({
			chdir: () => {
				throw new Error("boom");
			},
		});

		expect(() => {
			setCurrentWorkingDirectoryOrThrow("/tmp/mock-deno-cwd");
		}).toThrow(SetCurrentWorkingDirectoryError);
	});
});
