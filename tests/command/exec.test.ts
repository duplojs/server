import type * as DCommon from "@duplojs/lang/common";
import * as DDataStructure from "@duplojs/lang/dataStructure";
import * as DEither from "@duplojs/lang/either";
import { DServerCommand, TESTImplementation, setEnvironment } from "@scripts";

describe("exec", () => {
	afterEach(() => {
		setEnvironment("NODE");
		TESTImplementation.clear();
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	it("executes the root command without params and returns ok", async() => {
		setEnvironment("TEST");
		const getProcessArgumentsSpy = vi.fn().mockReturnValue([]);
		const executeSpy = vi.fn();
		TESTImplementation.set("getProcessArguments", getProcessArgumentsSpy);

		const result = await DServerCommand.exec(executeSpy);

		type _CheckResult = DCommon.ExpectType<
			typeof result,
			DEither.Error<DServerCommand.Error> | DEither.Ok,
			"strict"
		>;

		expect(DEither.isRight(result)).toBe(true);
		expect(DEither.unwrapRight(result)).toBeUndefined();
		expect(getProcessArgumentsSpy).toHaveBeenCalledTimes(1);
		expect(executeSpy).toHaveBeenCalledWith({
			options: {},
		});
	});

	it("executes with display name, options and arguments", async() => {
		setEnvironment("TEST");
		const getProcessArgumentsSpy = vi.fn().mockReturnValue(["subject", "--verbose"]);
		const executeSpy = vi.fn();
		TESTImplementation.set("getProcessArguments", getProcessArgumentsSpy);

		const result = await DServerCommand.exec(
			{
				displayName: "read",
				options: [DServerCommand.createBooleanOption("verbose")],
				subjects: [DServerCommand.createArgument("name", DDataStructure.string())],
			},
			(params) => {
				type _CheckOptions = DCommon.ExpectType<
					typeof params.options,
					{ readonly verbose: boolean },
					"strict"
				>;

				type _CheckArgs = DCommon.ExpectType<
					typeof params.args,
					{ readonly name: string },
					"strict"
				>;

				executeSpy(params);
			},
		);

		expect(DEither.isRight(result)).toBe(true);
		expect(executeSpy).toHaveBeenCalledWith({
			options: { verbose: true },
			args: { name: "subject" },
		});
	});

	it("logs interpreted command errors and returns them", async() => {
		setEnvironment("TEST");
		const getProcessArgumentsSpy = vi.fn().mockReturnValue(["bad"]);
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		TESTImplementation.set("getProcessArguments", getProcessArgumentsSpy);

		const result = await DServerCommand.exec(
			{
				displayName: "read",
				subjects: [DServerCommand.createArgument("id", DDataStructure.number())],
			},
			() => undefined,
		);

		if (!DEither.isLeft(result)) {
			throw new Error("Expected exec to return a left.");
		}

		expect(DEither.unwrapLeft(result).issues).toEqual([
			expect.objectContaining({
				argumentName: "id",
				data: "bad",
				path: "read",
			}),
		]);
		expect(getProcessArgumentsSpy).toHaveBeenCalledTimes(1);
		expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
		expect(String(consoleErrorSpy.mock.calls[0]?.[0])).toContain("Command failed");
		expect(String(consoleErrorSpy.mock.calls[0]?.[0])).toContain("COMMAND:");
		expect(String(consoleErrorSpy.mock.calls[0]?.[0])).toContain("read");
	});

	it("uses the custom data structure error interpreter", async() => {
		setEnvironment("TEST");
		const getProcessArgumentsSpy = vi.fn().mockReturnValue(["bad"]);
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		const dataStructureErrorInterpreter = vi.fn().mockReturnValue([
			{
				path: "",
				interpretedMessage: {
					source: "custom message",
				},
			},
		]);
		TESTImplementation.set("getProcessArguments", getProcessArgumentsSpy);

		const result = await DServerCommand.exec(
			{
				dataStructureErrorInterpreter,
				subjects: [DServerCommand.createArgument("id", DDataStructure.number())],
			},
			() => undefined,
		);

		if (!DEither.isLeft(result)) {
			throw new Error("Expected exec to return a left.");
		}

		expect(dataStructureErrorInterpreter).toHaveBeenCalledTimes(1);
		expect(String(consoleErrorSpy.mock.calls[0]?.[0])).toContain("custom message");
	});
});
