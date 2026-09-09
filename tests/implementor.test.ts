import { TESTImplementation, implementFunction, nodeCrypto, nodeFileSystem, nodeOs, setEnvironment, SupportedEnvironment } from "@scripts/implementor";

describe("implementor", () => {
	afterEach(() => {
		setEnvironment("NODE");
		TESTImplementation.clear();
		vi.clearAllMocks();
		vi.unstubAllGlobals();
	});

	it("includes TEST in supported environments", () => {
		expect(SupportedEnvironment.TEST).toBe("TEST");
	});

	it("stores and retrieves TEST implementations", () => {
		const implementation = vi.fn();

		TESTImplementation.set("exists", implementation);

		expect(TESTImplementation.get("exists")).toBe(implementation);

		TESTImplementation.clear();

		expect(TESTImplementation.get("exists")).toBeUndefined();
	});

	it("uses NODE implementation by default", () => {
		setEnvironment("NODE");
		const nodeImplementation = vi.fn().mockReturnValue("node-result");
		const runtimeFunction = implementFunction(
			"getCurrentWorkDirectory",
			{ NODE: nodeImplementation },
		);

		expect(runtimeFunction()).toBe("node-result");
		expect(nodeImplementation).toHaveBeenCalledTimes(1);
	});

	it("detects DENO environment at module initialization", async() => {
		vi.resetModules();
		vi.stubGlobal("Deno", {});
		vi.stubGlobal("Bun", undefined);

		const { implementFunction: isolatedImplementFunction } = await import("@scripts/implementor");
		const denoImplementation = vi.fn().mockReturnValue("deno-result");
		const runtimeFunction = isolatedImplementFunction(
			"getCurrentWorkDirectory",
			{
				NODE: vi.fn(),
				DENO: denoImplementation,
			},
		);

		expect(runtimeFunction()).toBe("deno-result");
		expect(denoImplementation).toHaveBeenCalledTimes(1);
	});

	it("detects BUN environment at module initialization", async() => {
		vi.resetModules();
		vi.stubGlobal("Deno", undefined);
		vi.stubGlobal("Bun", {});

		const { implementFunction: isolatedImplementFunction } = await import("@scripts/implementor");
		const bunImplementation = vi.fn().mockReturnValue("bun-result");
		const runtimeFunction = isolatedImplementFunction(
			"getCurrentWorkDirectory",
			{
				NODE: vi.fn(),
				BUN: bunImplementation,
			},
		);

		expect(runtimeFunction()).toBe("bun-result");
		expect(bunImplementation).toHaveBeenCalledTimes(1);
	});

	it("uses NODE fallback when no known runtime global is available", async() => {
		vi.resetModules();
		vi.stubGlobal("Deno", undefined);
		vi.stubGlobal("Bun", undefined);
		vi.stubGlobal("process", { versions: {} });

		const { implementFunction: isolatedImplementFunction } = await import("@scripts/implementor");
		const nodeImplementation = vi.fn().mockReturnValue("node-result");
		const runtimeFunction = isolatedImplementFunction(
			"getCurrentWorkDirectory",
			{ NODE: nodeImplementation },
		);

		expect(runtimeFunction()).toBe("node-result");
		expect(nodeImplementation).toHaveBeenCalledTimes(1);
	});

	it("uses explicit BUN and DENO implementations", () => {
		const bunImplementation = vi.fn().mockReturnValue("bun-result");
		const denoImplementation = vi.fn().mockReturnValue("deno-result");
		const runtimeFunction = implementFunction(
			"getCurrentWorkDirectory",
			{
				NODE: vi.fn(),
				BUN: bunImplementation,
				DENO: denoImplementation,
			},
		);

		setEnvironment("BUN");
		expect(runtimeFunction()).toBe("bun-result");

		setEnvironment("DENO");
		expect(runtimeFunction()).toBe("deno-result");

		expect(bunImplementation).toHaveBeenCalledTimes(1);
		expect(denoImplementation).toHaveBeenCalledTimes(1);
	});

	it("loads memoized node modules", async() => {
		await expect(nodeFileSystem.value).resolves.toHaveProperty("readFile");
		await expect(nodeCrypto.value).resolves.toHaveProperty("randomUUID");
		await expect(nodeOs.value).resolves.toHaveProperty("tmpdir");
	});

	it("falls back to NODE implementation for BUN and DENO when missing", () => {
		const nodeImplementation = vi.fn().mockReturnValue("node-result");
		const runtimeFunction = implementFunction(
			"getCurrentWorkDirectory",
			{ NODE: nodeImplementation },
		);

		setEnvironment("BUN");
		expect(runtimeFunction()).toBe("node-result");

		setEnvironment("DENO");
		expect(runtimeFunction()).toBe("node-result");

		expect(nodeImplementation).toHaveBeenCalledTimes(2);
	});

	it("uses the TEST implementation when TEST environment is selected", () => {
		setEnvironment("TEST");
		const testImplementation = vi.fn().mockReturnValue("test-result");
		const runtimeFunction = implementFunction(
			"getCurrentWorkDirectory",
			{ NODE: vi.fn() },
		);

		TESTImplementation.set("getCurrentWorkDirectory", testImplementation);

		expect(runtimeFunction()).toBe("test-result");
		expect(testImplementation).toHaveBeenCalledTimes(1);
	});

	it("throws when TEST environment implementation is missing", () => {
		setEnvironment("TEST");
		const runtimeFunction = implementFunction(
			"getCurrentWorkDirectory",
			{ NODE: vi.fn() },
		);

		expect(() => runtimeFunction()).toThrowError(
			"Missing function implementation \"getCurrentWorkDirectory\" in TEST environment.",
		);
	});
});
