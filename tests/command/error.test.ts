import * as DCommon from "@duplojs/lang/common";
import * as DDataStructure from "@duplojs/lang/dataStructure";
import * as DEither from "@duplojs/lang/either";
import { DServerCommand } from "@scripts";

describe("error", () => {
	it("creates a command error and records every issue kind", () => {
		const error = DServerCommand.createError("root");
		const dataStructureError = { issues: [] } as unknown as DDataStructure.Error;

		type _CheckError = DCommon.ExpectType<
			typeof error,
			DServerCommand.Error,
			"strict"
		>;

		error.pushPath("child");

		expect(error.addRequiredOptionIssue("token")).toBe(DServerCommand.SymbolCommandError);
		expect(error.addRequiredOptionValueIssue("name")).toBe(DServerCommand.SymbolCommandError);
		expect(error.addUnexpectedOptionValueIssue("verbose", "true")).toBe(DServerCommand.SymbolCommandError);
		expect(error.addDataStructureOptionIssue("count", "NaN", dataStructureError)).toBe(DServerCommand.SymbolCommandError);
		expect(error.addRequiredArgumentIssue("id")).toBe(DServerCommand.SymbolCommandError);
		expect(error.addDataStructureArgumentIssue("age", "old", dataStructureError)).toBe(DServerCommand.SymbolCommandError);
		expect(error.addTooMuchCommandArgumentIssue(1, 3)).toBe(DServerCommand.SymbolCommandError);

		expect(error.currentPath).toEqual(["root", "child"]);
		expect(error.issues).toEqual([
			expect.objectContaining({
				optionName: "token",
				data: undefined,
				path: "root.child",
			}),
			expect.objectContaining({
				optionName: "name",
				data: undefined,
				path: "root.child",
			}),
			expect.objectContaining({
				optionName: "verbose",
				data: "true",
				path: "root.child",
			}),
			expect.objectContaining({
				optionName: "count",
				data: "NaN",
				dataStructureError,
				path: "root.child",
			}),
			expect.objectContaining({
				argumentName: "id",
				data: undefined,
				path: "root.child",
			}),
			expect.objectContaining({
				argumentName: "age",
				data: "old",
				dataStructureError,
				path: "root.child",
			}),
			expect.objectContaining({
				expect: 1,
				receive: 3,
				path: "root.child",
			}),
		]);
	});

	it("interprets data structure errors with message priority and fallback", () => {
		const dataStructureError = { issues: [] } as unknown as DDataStructure.Error;
		const dataStructureErrorInterpreter = vi.fn().mockReturnValue([
			{
				path: "value",
				interpretedMessage: {
					subSource: "sub source",
					interpretedSubSource: "interpreted sub source",
					source: "source",
					interpretedSource: "interpreted source",
				},
			},
			{
				path: "nested",
				interpretedMessage: {
					interpretedSubSource: "interpreted sub source",
					source: "source",
					interpretedSource: "interpreted source",
				},
			},
			{
				path: "source",
				interpretedMessage: {
					source: "source",
					interpretedSource: "interpreted source",
				},
			},
			{
				path: "",
				interpretedMessage: {
					interpretedSource: "interpreted source",
				},
			},
			{
				path: "",
				interpretedMessage: {},
			},
		]);

		const result = DServerCommand.interpretDataStructureError(dataStructureError, dataStructureErrorInterpreter);

		expect(dataStructureErrorInterpreter).toHaveBeenCalledWith(dataStructureError);
		expect(result).toHaveLength(5);
		expect(result[0]).toContain("value");
		expect(result[0]).toContain("sub source");
		expect(result[1]).toContain("nested");
		expect(result[1]).toContain("interpreted sub source");
		expect(result[2]).toContain("source");
		expect(result[3]).toContain("<value>");
		expect(result[3]).toContain("interpreted source");
		expect(result[4]).toContain("unknown data structure error.");
	});

	it("renders all command issue kinds", () => {
		const dataStructureError = { issues: [] } as unknown as DDataStructure.Error;
		const error = DServerCommand.createError("root");
		const dataStructureErrorInterpreter = vi.fn().mockReturnValue([
			{
				path: "",
				interpretedMessage: {
					source: "invalid value",
				},
			},
		]);

		error.addDataStructureArgumentIssue("id", "bad", dataStructureError);
		error.addRequiredArgumentIssue("name");
		error.addDataStructureOptionIssue("count", "bad", dataStructureError);
		error.addRequiredOptionIssue("token");
		error.addRequiredOptionValueIssue("config");
		error.addUnexpectedOptionValueIssue("verbose", "true");
		error.addTooMuchCommandArgumentIssue(1, 2);

		const result = DServerCommand.interpretErrorIssues(error.issues, dataStructureErrorInterpreter);

		expect(dataStructureErrorInterpreter).toHaveBeenCalledTimes(2);
		expect(result).toContain("ARGUMENT:");
		expect(result).toContain("--id");
		expect(result).toContain("Missing Argument");
		expect(result).toContain("OPTION:");
		expect(result).toContain("--count");
		expect(result).toContain("Missing Option");
		expect(result).toContain("Missing Option Value");
		expect(result).toContain("Unexpected Value At This Option");
		expect(result).toContain("Too Much Arguments");
		expect(result).toContain("expect: 1 receive: 2");
		expect(result).toContain("invalid value");
	});

	it("renders a message when no issue exists", () => {
		const result = DServerCommand.interpretErrorIssues(
			[],
			vi.fn().mockReturnValue([]),
		);

		expect(result).toContain("No issue found");
	});

	it("renders command execution errors with the default interpreter", () => {
		const error = DServerCommand.createError("root");
		const checkResult = DDataStructure.number().check("bad");

		if (!DEither.isLeft(checkResult)) {
			throw new Error("Expected number check to return a left.");
		}

		error.pushPath("child");

		DCommon.asserts(checkResult, DEither.hasInformation("check-error"));

		error.addDataStructureArgumentIssue(
			"id",
			"bad",
			DEither.unwrapLeft(checkResult),
		);

		const result = DServerCommand.interpretExecCommandError(error);

		expect(result).toContain("Command failed");
		expect(result).toContain("COMMAND:");
		expect(result).toContain("root child");
		expect(result).toContain("ARGUMENT:");
		expect(result).toContain("Expected a finite number.");
	});

	it("renders command execution errors with a custom interpreter", () => {
		const error = DServerCommand.createError("root");
		const dataStructureError = { issues: [] } as unknown as DDataStructure.Error;
		const dataStructureErrorInterpreter = vi.fn().mockReturnValue([
			{
				path: "",
				interpretedMessage: {
					source: "custom command error",
				},
			},
		]);

		error.addDataStructureArgumentIssue("id", "bad", dataStructureError);

		const result = DServerCommand.interpretExecCommandError(error, dataStructureErrorInterpreter);

		expect(dataStructureErrorInterpreter).toHaveBeenCalledWith(dataStructureError);
		expect(result).toContain("custom command error");
	});

	it("renders options execution errors with the default interpreter", () => {
		const error = DServerCommand.createError("root");

		error.addRequiredOptionIssue("token");

		const result = DServerCommand.interpretExecOptionsError(error);

		expect(result).toContain("Invalid options");
		expect(result).toContain("OPTION:");
		expect(result).toContain("--token");
		expect(result).toContain("Missing Option");
	});

	it("renders options execution errors with a custom interpreter", () => {
		const error = DServerCommand.createError("root");
		const dataStructureError = { issues: [] } as unknown as DDataStructure.Error;
		const dataStructureErrorInterpreter = vi.fn().mockReturnValue([
			{
				path: "",
				interpretedMessage: {
					source: "custom option error",
				},
			},
		]);

		error.addDataStructureOptionIssue("count", "bad", dataStructureError);

		const result = DServerCommand.interpretExecOptionsError(error, dataStructureErrorInterpreter);

		expect(dataStructureErrorInterpreter).toHaveBeenCalledWith(dataStructureError);
		expect(result).toContain("Invalid options");
		expect(result).toContain("custom option error");
	});
});
