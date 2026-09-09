import * as DEither from "@duplojs/lang/either";
import { getCurrentWorkDirectory, setEnvironment } from "@scripts";
import { setDenoMock } from "@tests/_utils/deno.mock";
import { setProcessMock } from "@tests/_utils/process.mock";

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

		expect(DEither.isRight(result)).toBe(true);

		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result)).toBe(expected);
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

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("returns current working directory in DENO env", () => {
		setEnvironment("DENO");
		const expected = "/tmp/mock-deno-cwd";
		setDenoMock({
			cwd: () => expected,
		});

		const result = getCurrentWorkDirectory();

		expect(DEither.isRight(result)).toBe(true);
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result)).toBe(expected);
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

		expect(DEither.isLeft(result)).toBe(true);
	});
});
