import { type ExpectType, pipe } from "@duplojs/utils";
import { exitProcess, setEnvironment } from "@scripts";

describe("exitProcess", () => {
	afterEach(() => {
		setEnvironment("NODE");
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	it("calls process.exit in NODE environment", () => {
		setEnvironment("NODE");
		const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);

		exitProcess(12);

		expect(exitSpy).toHaveBeenCalledWith(12);
	});

	it("calls Deno.exit in DENO environment", () => {
		setEnvironment("DENO");
		const denoExitSpy = vi.fn();
		(globalThis as { Deno?: { exit(code?: number): void } }).Deno = {
			exit: denoExitSpy,
		};

		exitProcess(31);

		expect(denoExitSpy).toHaveBeenCalledWith(31);
	});

	it("falls back to NODE implementation in BUN environment", () => {
		setEnvironment("BUN");
		const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);

		exitProcess(7);

		expect(exitSpy).toHaveBeenCalledWith(7);
	});
});
