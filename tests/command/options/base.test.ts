import { type ExpectType, pipe } from "@duplojs/utils";
import { DServerCommand } from "@scripts";
import { createError, SymbolCommandError } from "@scripts/command/error";

describe("initOption", () => {
	afterEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	it("creates an option with default metadata", () => {
		const option = DServerCommand.initOption("verbose", ({ isHere }) => isHere);

		type _CheckName = ExpectType<
			typeof option.name,
			"verbose",
			"strict"
		>;

		expect(option.name).toBe("verbose");
		expect(option.description).toBeNull();
		expect(option.aliases).toEqual([]);
		expect(option.hasValue).toBe(false);
	});

	it("returns fallback execute output and keeps args when option is missing", async() => {
		const option = DServerCommand.initOption("verbose", (params) => params);
		const result = await option.execute(["--other"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		expect(result.result).toEqual({
			isHere: false,
			value: undefined,
		});
		expect(result.argumentRest).toEqual(["--other"]);
	});

	it("detects option by alias and removes the flag from args", async() => {
		const option = DServerCommand.initOption("verbose", (params) => params, { aliases: ["v"] });
		const result = await option.execute(["-v", "subject"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		expect(result.result).toEqual({
			isHere: true,
			value: undefined,
		});
		expect(result.argumentRest).toEqual(["subject"]);
	});

	it("extracts inline value when option requires a value", async() => {
		const option = DServerCommand.initOption("port", (params) => params, { hasValue: true });
		const result = await option.execute(["--port=8080", "subject"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		expect(result.result).toEqual({
			isHere: true,
			value: "8080",
		});
		expect(result.argumentRest).toEqual(["subject"]);
	});

	it("extracts next argument when option requires a value", async() => {
		const option = DServerCommand.initOption("port", (params) => params, { hasValue: true });
		const result = await option.execute(["--port", "8080", "subject"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		expect(result.result).toEqual({
			isHere: true,
			value: "8080",
		});
		expect(result.argumentRest).toEqual(["subject"]);
	});

	it("returns command error when required value looks like another option", async() => {
		const option = DServerCommand.initOption("port", (params) => params, { hasValue: true });
		const error = createError("root");

		await expect(option.execute(["--port", "--other"], error)).resolves.toBe(SymbolCommandError);
		expect(error.issues[0]?.expected).toBe("value for option --port");
	});

	it("keeps undefined when no value is provided to a value option", async() => {
		const option = DServerCommand.initOption("port", (params) => params, { hasValue: true });
		const result = await option.execute(["--port"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		expect(result.result).toEqual({
			isHere: true,
			value: undefined,
		});
		expect(result.argumentRest).toEqual([]);
	});

	it("returns command error when value is provided to an option without value", async() => {
		const option = DServerCommand.initOption("verbose", (params) => params);
		const error = createError("root");

		await expect(option.execute(["--verbose=true"], error)).resolves.toBe(SymbolCommandError);
		expect(error.issues[0]?.expected).toBe("option without value --verbose");
	});

	it("returns command error when execute fails on a present option without value", async() => {
		const option = DServerCommand.initOption(
			"verbose",
			() => SymbolCommandError,
		);

		await expect(option.execute(["--verbose"], createError("root"))).resolves.toBe(SymbolCommandError);
	});

	it("works when execute is called from pipe", async() => {
		const option = DServerCommand.initOption("verbose", ({ isHere }) => isHere);
		const result = await pipe(["--verbose"], (args) => option.execute(args, createError("root")));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		type _CheckResult = ExpectType<
			typeof result.result,
			boolean,
			"strict"
		>;

		expect(result.result).toBe(true);
	});
});
