import * as DCommon from "@duplojs/lang/common";
import * as DDataStructure from "@duplojs/lang/dataStructure";
import * as DEither from "@duplojs/lang/either";
import { DServerCommand, TESTImplementation, setEnvironment } from "@duplojs/server";
import { assertEquals } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";

const initialConsoleLog = console.log;
const initialConsoleError = console.error;
let consoleLogOutput = "";
let consoleErrorOutput = "";

describe("command feature on deno", () => {
	beforeEach(() => {
		setEnvironment("TEST");
		TESTImplementation.clear();
		consoleLogOutput = "";
		consoleErrorOutput = "";
		console.log = (...args: unknown[]) => {
			consoleLogOutput = args.map(String).join(" ");
		};
		console.error = (...args: unknown[]) => {
			consoleErrorOutput = args.map(String).join(" ");
		};
	});

	afterEach(() => {
		setEnvironment("NODE");
		TESTImplementation.clear();
		console.log = initialConsoleLog;
		console.error = initialConsoleError;
	});

	it("executes a command with options and arguments", async() => {
		TESTImplementation.set("getProcessArguments", () => ["build", "--verbose", "--count", "3", "--tags", "api,http"]);

		let executeParams: unknown;
		const result = await DServerCommand.exec(
			{
				displayName: "tool",
				options: [
					DServerCommand.createBooleanOption("verbose"),
					DServerCommand.createOption("count", DDataStructure.number(), { required: true }),
					DServerCommand.createArrayOption("tags", DDataStructure.string()),
				],
				subjects: [
					DServerCommand.createArgument("task", DDataStructure.string()),
				],
			},
			(params) => {
				executeParams = params;
			},
		);

		assertEquals(DEither.isRight(result), true);
		assertEquals(executeParams, {
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
		let rootCalled = false;
		let deployParams: unknown;
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
						(params) => {
							deployParams = params;
						},
					),
				],
			},
			() => {
				rootCalled = true;
			},
		);

		const result = await command.execute(["deploy", "production", "--dry-run"], error);

		assertEquals(result, undefined);
		assertEquals(rootCalled, false);
		assertEquals(deployParams, {
			options: { "dry-run": true },
			args: { target: "production" },
		});
		assertEquals(error.issues, []);
	});

	it("returns a command error from exec", async() => {
		TESTImplementation.set("getProcessArguments", () => ["wrong"]);
		let executeCalled = false;

		const result = await DServerCommand.exec(
			{
				displayName: "read",
				subjects: [DServerCommand.createArgument("id", DDataStructure.number())],
			},
			() => {
				executeCalled = true;
			},
		);

		DCommon.asserts(result, DEither.isLeft);

		assertEquals(executeCalled, false);
		assertEquals(DEither.unwrapLeft(result).issues.length, 1);
		assertEquals(consoleErrorOutput.includes("Command failed"), true);
		assertEquals(consoleErrorOutput.includes("--id"), true);
		assertEquals(consoleErrorOutput.includes("number"), true);
	});

	it("prints command help without executing the command", async() => {
		TESTImplementation.set("getProcessArguments", () => ["--help"]);
		let executeCalled = false;

		const result = await DServerCommand.exec(
			{
				displayName: "cli",
				description: "Integration command.",
				options: [DServerCommand.createBooleanOption("verbose", { aliases: ["v"] })],
				subjects: [DServerCommand.createArgument("target", DDataStructure.string())],
			},
			() => {
				executeCalled = true;
			},
		);

		assertEquals(DEither.isRight(result), true);
		assertEquals(executeCalled, false);
		assertEquals(consoleLogOutput.includes("COMMAND"), true);
		assertEquals(consoleLogOutput.includes("cli"), true);
		assertEquals(consoleLogOutput.includes("--"), true);
		assertEquals(consoleLogOutput.includes("verbose"), true);
	});
});
