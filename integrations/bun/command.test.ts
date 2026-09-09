import * as DCommon from "@duplojs/lang/common";
import * as DDataStructure from "@duplojs/lang/dataStructure";
import * as DEither from "@duplojs/lang/either";
import { DServerCommand, TESTImplementation, setEnvironment } from "@duplojs/server";
import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";

describe("command feature on bun", () => {
	afterEach(() => {
		setEnvironment("NODE");
		TESTImplementation.clear();
		mock.restore();
	});

	it("executes a command with options and arguments", async() => {
		setEnvironment("TEST");
		TESTImplementation.set("getProcessArguments", mock(() => ["build", "--verbose", "--count", "3", "--tags", "api,http"]));

		const executeSpy = mock(() => undefined);
		const result = await DServerCommand.exec(
			{
				displayName: "tool",
				options: [
					DServerCommand.createBooleanOption("verbose"),
					DServerCommand.createOption("count", DDataStructure.number(), { required: true }),
					DServerCommand.createArrayOption("tags", DDataStructure.string()),
				],
				subjects: [DServerCommand.createArgument("task", DDataStructure.string())],
			},
			executeSpy,
		);

		expect(DEither.isRight(result)).toBe(true);
		expect(executeSpy).toHaveBeenCalledWith({
			options: {
				verbose: true,
				count: 3,
				tags: ["api", "http"],
			},
			args: {
				task: "build",
			},
		});
	});

	it("routes to a sub command", async() => {
		const rootSpy = mock(() => undefined);
		const deploySpy = mock(() => undefined);
		const error = DServerCommand.createError("tool");
		const command = DServerCommand.create(
			"tool",
			{
				subjects: [
					DServerCommand.create(
						"deploy",
						{
							options: [DServerCommand.createBooleanOption("dry-run")],
							subjects: [DServerCommand.createArgument("target", DDataStructure.string())],
						},
						deploySpy,
					),
				],
			},
			rootSpy,
		);

		const result = await command.execute(["deploy", "production", "--dry-run"], error);

		expect(result).toBeUndefined();
		expect(rootSpy).not.toHaveBeenCalled();
		expect(deploySpy).toHaveBeenCalledWith({
			options: { "dry-run": true },
			args: { target: "production" },
		});
		expect(error.issues).toEqual([]);
	});

	it("returns a command error from exec", async() => {
		setEnvironment("TEST");
		TESTImplementation.set("getProcessArguments", mock(() => ["wrong"]));
		const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => undefined);
		const executeSpy = mock(() => undefined);

		const result = await DServerCommand.exec(
			{
				displayName: "read",
				subjects: [DServerCommand.createArgument("id", DDataStructure.number())],
			},
			executeSpy,
		);

		DCommon.asserts(result, DEither.isLeft);

		expect(executeSpy).not.toHaveBeenCalled();
		expect(DEither.unwrapLeft(result).issues).toEqual([
			expect.objectContaining({
				argumentName: "id",
				data: "wrong",
				path: "read",
			}),
		]);
		expect(String(consoleErrorSpy.mock.calls[0]?.[0])).toContain("Command failed");
	});

	it("prints command help without executing the command", async() => {
		setEnvironment("TEST");
		TESTImplementation.set("getProcessArguments", mock(() => ["--help"]));
		const consoleLogSpy = spyOn(console, "log").mockImplementation(() => undefined);
		const executeSpy = mock(() => undefined);

		const result = await DServerCommand.exec(
			{
				displayName: "cli",
				description: "Integration command.",
				options: [DServerCommand.createBooleanOption("verbose", { aliases: ["v"] })],
				subjects: [DServerCommand.createArgument("target", DDataStructure.string())],
			},
			executeSpy,
		);

		expect(DEither.isRight(result)).toBe(true);
		expect(executeSpy).not.toHaveBeenCalled();
		expect(String(consoleLogSpy.mock.calls[0]?.[0])).toContain("COMMAND");
		expect(String(consoleLogSpy.mock.calls[0]?.[0])).toContain("cli");
		expect(String(consoleLogSpy.mock.calls[0]?.[0])).toContain("--");
		expect(String(consoleLogSpy.mock.calls[0]?.[0])).toContain("verbose");
	});
});
