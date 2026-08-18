import { E, unwrap } from "@duplojs/utils";
import { setEnvironment, getCurrentWorkDirectory, getCurrentWorkDirectoryOrThrow } from "@scripts";
import { setDenoMock } from "tests/_utils/deno.mock";
import { setProcessMock } from "tests/_utils/process.mock";

describe("getCurrentWorkDirectory", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("returns current working directory in NODE env", () => {
		setEnvironment("NODE");
		const expected = "/tmp/mock-cwd";
		setProcessMock({
			cwd: () => expected,
		});

		const result = getCurrentWorkDirectory();

		expect(E.isRight(result)).toBe(true);

		if (E.isRight(result)) {
			expect(unwrap(result)).toBe(expected);
		}
	});

	it("returns fail when process.cwd throws in NODE env", () => {
		setEnvironment("NODE");
		setProcessMock({
			cwd: () => {
				throw new Error("boom");
			},
		});

		const result = getCurrentWorkDirectory();

		expect(E.isLeft(result)).toBe(true);
	});

	it("returns current working directory in DENO env", () => {
		setEnvironment("DENO");
		const expected = "/tmp/mock-deno-cwd";
		setDenoMock({
			cwd: () => expected,
		});

		const result = getCurrentWorkDirectory();

		expect(E.isRight(result)).toBe(true);
		if (E.isRight(result)) {
			expect(unwrap(result)).toBe(expected);
		}
	});

	it("returns fail when Deno.cwd throws in DENO env", () => {
		setEnvironment("DENO");
		setDenoMock({
			cwd: () => {
				throw new Error("boom");
			},
		});

		const result = getCurrentWorkDirectory();

		expect(E.isLeft(result)).toBe(true);
	});

	it("getCurrentWorkDirectoryOrThrow node", () => {
		setEnvironment("NODE");

		setProcessMock({
			cwd: () => "/node",
		});

		const result = getCurrentWorkDirectoryOrThrow();

		expect(result).toBe("/node");
	});

	it("getCurrentWorkDirectoryOrThrow deno", () => {
		setEnvironment("DENO");

		setDenoMock({
			cwd: () => "/deno",
		});

		const result = getCurrentWorkDirectoryOrThrow();

		expect(result).toBe("/deno");
	});
});
