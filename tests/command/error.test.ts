import { DP, E, type ExpectType, unwrap } from "@duplojs/utils";
import { SymbolCommandError, addIssue, addIssueDataParser, createError, interpretCommandError, interpretExecOptionError } from "@scripts/command/error";

describe("error", () => {
	it("creates command error", () => {
		const error = createError("root");

		type _CheckPath = ExpectType<typeof error.currentCommandPath, string[], "strict">;
		expect(error.currentCommandPath).toEqual(["root"]);
	});

	it("adds direct command issue", () => {
		const error = createError("root");
		expect(
			addIssue(error, {
				type: "command",
				expected: "something",
				received: "other",
			}),
		).toBe(SymbolCommandError);

		expect(error.issues[0]?.commandPath).toEqual(["root"]);
		expect(interpretCommandError(error)).toContain("Command failed");
	});

	it("renders issue message in command interpreter", () => {
		const error = createError("root");
		addIssue(error, {
			type: "command",
			expected: "x",
			received: "y",
			message: "custom message",
		});

		const output = interpretCommandError(error);
		expect(output).toContain("custom message");
	});

	it("adds parser issues for option and argument", () => {
		const error = createError("root");
		const optionResult = DP.boolean().parse("yes");
		expect(E.isLeft(optionResult)).toBe(true);
		if (!E.isLeft(optionResult)) {
			return;
		}

		addIssueDataParser(error, unwrap(optionResult), {
			type: "option",
			target: "enabled",
		});

		error.currentCommandPath[1] = "child";
		const argumentResult = DP.tuple([DP.string(), DP.number()]).parse(["ok", "bad"]);
		expect(E.isLeft(argumentResult)).toBe(true);
		if (!E.isLeft(argumentResult)) {
			return;
		}

		addIssueDataParser(error, unwrap(argumentResult), {
			type: "argument",
			target: "payload",
		});

		const output = interpretCommandError(error);
		expect(output).toContain("OPTION:");
		expect(output).toContain("--enabled");
		expect(output).toContain("ARGUMENT:");
		expect(output).toContain("payload");
		expect(output).toContain("[tuple: 1]");
	});

	it("interprets exec option error", () => {
		const error = createError("root");
		addIssue(error, {
			type: "option",
			target: "payload",
			expected: "boolean",
			received: "yes",
			parserPath: "[1]",
			message: "Boolean value expected.",
		});

		const output = interpretExecOptionError(error);
		expect(output).toContain("Invalid options");
		expect(output).toContain("OPTION:");
		expect(output).toContain("--payload");
		expect(output).toContain("Boolean value expected.");
	});

	it("renders fallback with no issues", () => {
		expect(interpretCommandError(createError("root"))).toContain("No issue found");
		expect(interpretExecOptionError(createError("root"))).toContain("No issue found");
	});
});
