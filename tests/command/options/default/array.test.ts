import type * as DArray from "@duplojs/lang/array";
import type * as DCommon from "@duplojs/lang/common";
import * as DDataStructure from "@duplojs/lang/dataStructure";
import { DServerCommand } from "@scripts";

describe("createArrayOption", () => {
	it("creates an optional array option", () => {
		const dataStructure = DDataStructure.string();
		const option = DServerCommand.createArrayOption("tags", dataStructure, {
			description: "Release tags.",
			aliases: ["t"],
		});

		type _CheckOption = DCommon.ExpectType<
			typeof option,
			DServerCommand.ArrayOption<"tags", readonly string[] | undefined>,
			"strict"
		>;

		expect(option.name).toBe("tags");
		expect(option.description).toBe("Release tags.");
		expect(option.aliases).toEqual(["t"]);
		expect(option.required).toBe(false);
		expect(option.separator).toBe(",");
		expect(option.min).toBeUndefined();
		expect(option.max).toBeUndefined();
		expect(DServerCommand.arrayOptionKind.has(option)).toBe(true);
	});

	it("creates a required array option with constraints and a custom separator", () => {
		const option = DServerCommand.createArrayOption("ids", DDataStructure.number(), {
			required: true,
			min: 1,
			max: 2,
			separator: "|",
		});

		type _CheckOption = DCommon.ExpectType<
			typeof option,
			DServerCommand.ArrayOption<"ids", readonly number[] & DArray.MinElements<1> & DArray.MaxElements<2>>,
			"strict"
		>;

		expect(option.description).toBeNull();
		expect(option.aliases).toEqual([]);
		expect(option.required).toBe(true);
		expect(option.separator).toBe("|");
		expect(option.min).toBe(1);
		expect(option.max).toBe(2);
	});

	it("returns undefined when an optional array option is missing", async() => {
		const option = DServerCommand.createArrayOption("tags", DDataStructure.string());
		const error = DServerCommand.createError("root");

		await expect(option.execute([], error)).resolves.toEqual({
			result: undefined,
			argumentRest: [],
		});
		expect(error.issues).toEqual([]);
	});

	it("returns a command error when a required array option is missing", async() => {
		const option = DServerCommand.createArrayOption("tags", DDataStructure.string(), {
			required: true,
		});
		const error = DServerCommand.createError("root");

		await expect(option.execute([], error)).resolves.toBe(DServerCommand.SymbolCommandError);
		expect(error.issues).toEqual([
			expect.objectContaining({
				optionName: "tags",
				data: undefined,
				path: "root",
			}),
		]);
	});

	it("returns a command error when an array option value is missing", async() => {
		const option = DServerCommand.createArrayOption("tags", DDataStructure.string());
		const error = DServerCommand.createError("root");

		await expect(option.execute(["--tags"], error)).resolves.toBe(DServerCommand.SymbolCommandError);
		expect(error.issues).toEqual([
			expect.objectContaining({
				optionName: "tags",
				data: undefined,
				path: "root",
			}),
		]);
	});

	it("decodes an array option with the default separator", async() => {
		const option = DServerCommand.createArrayOption("ids", DDataStructure.number());
		const error = DServerCommand.createError("root");

		await expect(option.execute(["--ids", "1,2,3", "rest"], error)).resolves.toEqual({
			result: [1, 2, 3],
			argumentRest: ["rest"],
		});
		expect(error.issues).toEqual([]);
	});

	it("decodes an array option with a custom separator", async() => {
		const option = DServerCommand.createArrayOption("ids", DDataStructure.number(), {
			separator: "|",
		});
		const error = DServerCommand.createError("root");

		await expect(option.execute(["--ids=1|2|3"], error)).resolves.toEqual({
			result: [1, 2, 3],
			argumentRest: [],
		});
		expect(error.issues).toEqual([]);
	});

	it("decodes an array option alias value", async() => {
		const option = DServerCommand.createArrayOption("tags", DDataStructure.string(), {
			aliases: ["t"],
		});
		const error = DServerCommand.createError("root");

		await expect(option.execute(["-t=alpha,beta"], error)).resolves.toEqual({
			result: ["alpha", "beta"],
			argumentRest: [],
		});
		expect(error.issues).toEqual([]);
	});

	it("returns a command error when an array item decoding fails", async() => {
		const option = DServerCommand.createArrayOption("ids", DDataStructure.number());
		const error = DServerCommand.createError("root");

		await expect(option.execute(["--ids", "1,bad"], error)).resolves.toBe(DServerCommand.SymbolCommandError);
		expect(error.issues).toEqual([
			expect.objectContaining({
				optionName: "ids",
				data: "1,bad",
				path: "root",
			}),
		]);
	});

	it("returns a command error when array constraints fail", async() => {
		const option = DServerCommand.createArrayOption("ids", DDataStructure.number(), {
			min: 2,
			max: 3,
		});
		const error = DServerCommand.createError("root");

		await expect(option.execute(["--ids", "1"], error)).resolves.toBe(DServerCommand.SymbolCommandError);
		expect(error.issues).toEqual([
			expect.objectContaining({
				optionName: "ids",
				data: "1",
				path: "root",
			}),
		]);
	});
});
