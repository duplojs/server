import { type ExpectType } from "@duplojs/utils";
import { DServerCommand } from "@scripts";
import { createError, SymbolCommandError } from "@scripts/command/error";

describe("createBooleanOption", () => {
	afterEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	it("returns false when option is missing", async() => {
		const option = DServerCommand.createBooleanOption("help");
		const result = await option.execute(["subject"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		type _CheckResult = ExpectType<
			typeof result.result,
			boolean,
			"strict"
		>;

		expect(result.result).toBe(false);
		expect(result.argumentRest).toEqual(["subject"]);
	});

	it("returns true when option is present", async() => {
		const option = DServerCommand.createBooleanOption("help");
		const result = await option.execute(["--help", "subject"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		expect(result.result).toBe(true);
		expect(result.argumentRest).toEqual(["subject"]);
	});

	it("returns true when alias is present", async() => {
		const option = DServerCommand.createBooleanOption("help", { aliases: ["h"] });
		const result = await option.execute(["-h", "subject"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		expect(result.result).toBe(true);
		expect(result.argumentRest).toEqual(["subject"]);
	});

	it("returns command error when a value is provided", async() => {
		const option = DServerCommand.createBooleanOption("help");
		const error = createError("root");

		await expect(option.execute(["--help=true"], error)).resolves.toBe(SymbolCommandError);
		expect(error.issues[0]?.expected).toBe("option without value --help");
	});
});
