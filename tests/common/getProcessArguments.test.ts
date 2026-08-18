import { type ExpectType, pipe } from "@duplojs/utils";
import { clearBunMock } from "tests/_utils/bun.mock";

describe("getProcessArguments", () => {
	const initialArgv = [...process.argv];

	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(async() => {
		const { setEnvironment } = await import("@scripts");
		setEnvironment("NODE");
		process.argv = [...initialArgv];
		clearBunMock();
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	it("returns cached process arguments in NODE environment", async() => {
		const { getProcessArguments, setEnvironment } = await import("@scripts");
		setEnvironment("NODE");
		process.argv = ["node", "script.ts", "--foo", "bar"];

		const firstResult = getProcessArguments();

		process.argv = ["node", "script.ts", "--updated"];
		const secondResult = getProcessArguments();

		type _CheckResult = ExpectType<
			typeof firstResult,
			string[],
			"strict"
		>;

		expect(firstResult).toEqual(["--foo", "bar"]);
		expect(secondResult).toBe(firstResult);
	});

	it("returns Deno.args in DENO environment", async() => {
		const { getProcessArguments, setEnvironment } = await import("@scripts");
		setEnvironment("DENO");
		(globalThis as { Deno?: { args: string[] } }).Deno = {
			args: ["--deno", "value"],
		};

		const result = getProcessArguments();

		expect(result).toEqual(["--deno", "value"]);
	});

	it("returns cached Bun.argv in BUN environment", async() => {
		const { getProcessArguments, setEnvironment } = await import("@scripts");
		setEnvironment("BUN");
		(globalThis as { Bun?: { argv: string[] } }).Bun = {
			argv: ["bun", "script.ts", "--bun", "value"],
		};

		const firstResult = getProcessArguments();

		(globalThis as { Bun?: { argv: string[] } }).Bun = {
			argv: ["bun", "script.ts", "--new"],
		};
		const secondResult = getProcessArguments();

		expect(firstResult).toEqual(["--bun", "value"]);
		expect(secondResult).toBe(firstResult);
	});

	it("works when called from pipe", async() => {
		const { getProcessArguments, setEnvironment } = await import("@scripts");
		setEnvironment("NODE");
		process.argv = ["node", "script.ts", "--pipe"];

		const result = pipe("ignored", () => getProcessArguments());

		type _CheckResult = ExpectType<
			typeof result,
			string[],
			"strict"
		>;

		expect(result).toEqual(["--pipe"]);
	});
});
