import * as DCommon from "@duplojs/lang/common";
import * as DDataStructure from "@duplojs/lang/dataStructure";
import * as DEither from "@duplojs/lang/either";
import { DServerCommand, TESTImplementation, setEnvironment } from "@duplojs/server";

const escapeCode = String.fromCharCode(27);
const ansiEscapeCodePattern = new RegExp(`${escapeCode}\\[[0-9;]*m`, "g");

describe("command feature on node", () => {
	afterEach(() => {
		setEnvironment("NODE");
		TESTImplementation.clear();
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	it("executes a command with options and arguments", async() => {
		setEnvironment("TEST");
		TESTImplementation.set("getProcessArguments", vi.fn().mockReturnValue(["build", "--verbose", "--count", "3", "--tags", "api,http"]));

		const executeSpy = vi.fn();
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
		const rootSpy = vi.fn();
		const deploySpy = vi.fn();
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

		await expect(command.execute(["deploy", "production", "--dry-run"], error)).resolves.toBeUndefined();

		expect(rootSpy).not.toHaveBeenCalled();
		expect(deploySpy).toHaveBeenCalledWith({
			options: { "dry-run": true },
			args: { target: "production" },
		});
		expect(error.issues).toEqual([]);
	});

	it("returns a command error from exec", async() => {
		setEnvironment("TEST");
		TESTImplementation.set("getProcessArguments", vi.fn().mockReturnValue(["wrong"]));
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		const executeSpy = vi.fn();

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
		expect(
			String(consoleErrorSpy.mock.calls[0]?.[0])
				.replace(ansiEscapeCodePattern, ""),
		).toMatchSnapshot();
	});

	it("prints command help without executing the command", async() => {
		setEnvironment("TEST");
		TESTImplementation.set("getProcessArguments", vi.fn().mockReturnValue(["--help"]));
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
		const executeSpy = vi.fn();

		const result = await DServerCommand.exec(
			{
				displayName: "cli",
				description: "Integration command.",
				options: [
					DServerCommand.createBooleanOption("verbose", {
						description: "Print detailed logs.",
						aliases: ["v"],
					}),
					DServerCommand.createOption(
						"count",
						DDataStructure.number([DDataStructure.integer(), DDataStructure.greaterThanOrEqual(1)]),
						{
							description: "Number of executions.",
							required: true,
						},
					),
					DServerCommand.createArrayOption(
						"tags",
						DDataStructure.string([DDataStructure.minCharacters(2)]),
						{
							description: "Execution tags.",
							aliases: ["t"],
							min: 1,
							max: 3,
						},
					),
				],
				subjects: [
					DServerCommand.createArgument(
						"target",
						DDataStructure.string([DDataStructure.notEmpty()]),
						{ description: "Deployment target." },
					),
				],
			},
			executeSpy,
		);

		expect(DEither.isRight(result)).toBe(true);
		expect(executeSpy).not.toHaveBeenCalled();
		expect(
			String(consoleLogSpy.mock.calls[0]?.[0])
				.replace(ansiEscapeCodePattern, ""),
		).toMatchSnapshot();
	});
});
