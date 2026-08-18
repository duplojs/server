import { E } from "@duplojs/utils";
import { setCurrentWorkingDirectory, setEnvironment } from "@scripts";
import { setDenoMock } from "tests/_utils/deno.mock";
import { setProcessMock } from "tests/_utils/process.mock";

describe("setCurrentWorkingDirectory", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("returns ok in NODE env with string path", () => {
		setEnvironment("NODE");
		const chdirSpy = vi.fn();
		setProcessMock({ chdir: chdirSpy });

		const result = setCurrentWorkingDirectory("/tmp/mock-cwd");

		expect(E.isRight(result)).toBe(true);
		expect(chdirSpy).toHaveBeenCalledWith("/tmp/mock-cwd");
	});

	it("accepts a path with spaces in NODE env", () => {
		setEnvironment("NODE");
		const chdirSpy = vi.fn();
		setProcessMock({ chdir: chdirSpy });

		const result = setCurrentWorkingDirectory("/tmp/mock cwd");

		expect(E.isRight(result)).toBe(true);
		expect(chdirSpy).toHaveBeenCalledWith("/tmp/mock cwd");
	});

	it("decodes URL in NODE env", () => {
		setEnvironment("NODE");
		const chdirSpy = vi.fn();
		setProcessMock({ chdir: chdirSpy });
		const url = new URL("file:///tmp/mock%20cwd");

		const result = setCurrentWorkingDirectory(url as unknown as string);

		expect(E.isRight(result)).toBe(true);
		expect(chdirSpy).toHaveBeenCalledWith("/tmp/mock cwd");
	});

	it("returns fail when process.chdir throws in NODE env", () => {
		setEnvironment("NODE");
		setProcessMock({
			chdir: () => {
				throw new Error("boom");
			},
		});

		const result = setCurrentWorkingDirectory("/tmp/mock-cwd");

		expect(E.isLeft(result)).toBe(true);
	});

	it("returns ok in DENO env", () => {
		setEnvironment("DENO");
		const chdirSpy = vi.fn();
		setDenoMock({
			chdir: chdirSpy,
		});

		const result = setCurrentWorkingDirectory("/tmp/mock-deno-cwd");

		expect(E.isRight(result)).toBe(true);
		expect(chdirSpy).toHaveBeenCalledWith("/tmp/mock-deno-cwd");
	});

	it("accepts a path with spaces in DENO env", () => {
		setEnvironment("DENO");
		const chdirSpy = vi.fn();
		setDenoMock({
			chdir: chdirSpy,
		});

		const result = setCurrentWorkingDirectory("/tmp/mock deno cwd");

		expect(E.isRight(result)).toBe(true);
		expect(chdirSpy).toHaveBeenCalledWith("/tmp/mock deno cwd");
	});

	it("decodes URL in DENO env", () => {
		setEnvironment("DENO");
		const chdirSpy = vi.fn();
		setDenoMock({
			chdir: chdirSpy,
		});
		const url = new URL("file:///tmp/mock%20deno%20cwd");

		const result = setCurrentWorkingDirectory(url as unknown as string);

		expect(E.isRight(result)).toBe(true);
		expect(chdirSpy).toHaveBeenCalledWith("/tmp/mock deno cwd");
	});

	it("returns fail when Deno.chdir throws in DENO env", () => {
		setEnvironment("DENO");
		setDenoMock({
			chdir: () => {
				throw new Error("boom");
			},
		});

		const result = setCurrentWorkingDirectory("/tmp/mock-deno-cwd");

		expect(E.isLeft(result)).toBe(true);
	});
});
