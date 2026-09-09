import type * as DCommon from "@duplojs/lang/common";
import * as DDataStructure from "@duplojs/lang/dataStructure";
import * as DEither from "@duplojs/lang/either";
import { DServerCommand, TESTImplementation, setEnvironment } from "@scripts";

describe("execOptions", () => {
	afterEach(() => {
		setEnvironment("NODE");
		TESTImplementation.clear();
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	it("returns parsed options as a success", async() => {
		setEnvironment("TEST");
		const getProcessArgumentsSpy = vi.fn().mockReturnValue(["--verbose", "--name=duplo"]);
		TESTImplementation.set("getProcessArguments", getProcessArgumentsSpy);

		const result = await DServerCommand.execOptions([
			DServerCommand.createBooleanOption("verbose"),
			DServerCommand.createOption("name", DDataStructure.string()),
		]);

		type _CheckResult = DCommon.ExpectType<
			typeof result,
			(
				| DEither.Success<{
					readonly verbose: boolean;
					readonly name: string | undefined;
				}>
				| DEither.Right<"log-help">
				| DEither.Error<DServerCommand.Error>
			),
			"strict"
		>;

		expect(DEither.isRight(result)).toBe(true);
		expect(DEither.unwrapRight(result)).toEqual({
			verbose: true,
			name: "duplo",
		});
		expect(getProcessArgumentsSpy).toHaveBeenCalledTimes(1);
	});

	it("returns default option values while leaving unmatched arguments alone", async() => {
		setEnvironment("TEST");
		const getProcessArgumentsSpy = vi.fn().mockReturnValue(["remaining", "args"]);
		TESTImplementation.set("getProcessArguments", getProcessArgumentsSpy);

		const result = await DServerCommand.execOptions([
			DServerCommand.createBooleanOption("verbose"),
			DServerCommand.createOption("name", DDataStructure.string()),
		]);

		expect(DEither.isRight(result)).toBe(true);
		expect(DEither.unwrapRight(result)).toEqual({
			verbose: false,
			name: undefined,
		});
		expect(getProcessArgumentsSpy).toHaveBeenCalledTimes(1);
	});

	it("logs option help and returns a log-help right", async() => {
		setEnvironment("TEST");
		const getProcessArgumentsSpy = vi.fn().mockReturnValue(["-h"]);
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
		TESTImplementation.set("getProcessArguments", getProcessArgumentsSpy);

		const result = await DServerCommand.execOptions([DServerCommand.createBooleanOption("verbose")]);

		expect(DEither.isRight(result)).toBe(true);
		expect(DEither.unwrapRight(result)).toBeUndefined();
		expect(consoleLogSpy).toHaveBeenCalledTimes(1);
		expect(String(consoleLogSpy.mock.calls[0]?.[0])).toContain("EXEC OPTIONS");
		expect(String(consoleLogSpy.mock.calls[0]?.[0])).toContain("verbose");
	});

	it("logs malformed help option errors and returns them", async() => {
		setEnvironment("TEST");
		const getProcessArgumentsSpy = vi.fn().mockReturnValue(["--help=true"]);
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		TESTImplementation.set("getProcessArguments", getProcessArgumentsSpy);

		const result = await DServerCommand.execOptions([DServerCommand.createBooleanOption("verbose")]);

		if (!DEither.isLeft(result)) {
			throw new Error("Expected execOptions to return a left.");
		}

		expect(DEither.unwrapLeft(result).issues).toEqual([
			expect.objectContaining({
				optionName: "help",
				data: "true",
				path: "root",
			}),
		]);
		expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
		expect(String(consoleErrorSpy.mock.calls[0]?.[0])).toContain("Invalid options");
	});

	it("logs option parsing errors and returns them", async() => {
		setEnvironment("TEST");
		const getProcessArgumentsSpy = vi.fn().mockReturnValue(["--count", "invalid"]);
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		TESTImplementation.set("getProcessArguments", getProcessArgumentsSpy);

		const result = await DServerCommand.execOptions([DServerCommand.createOption("count", DDataStructure.number())]);

		if (!DEither.isLeft(result)) {
			throw new Error("Expected execOptions to return a left.");
		}

		expect(DEither.unwrapLeft(result).issues).toEqual([
			expect.objectContaining({
				optionName: "count",
				data: "invalid",
				path: "root",
			}),
		]);
		expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
		expect(String(consoleErrorSpy.mock.calls[0]?.[0])).toContain("Invalid options");
	});

	it("uses the custom data structure error interpreter", async() => {
		setEnvironment("TEST");
		const getProcessArgumentsSpy = vi.fn().mockReturnValue(["--count", "invalid"]);
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		const dataStructureErrorInterpreter = vi.fn().mockReturnValue([
			{
				path: "",
				interpretedMessage: {
					source: "custom option message",
				},
			},
		]);
		TESTImplementation.set("getProcessArguments", getProcessArgumentsSpy);

		const result = await DServerCommand.execOptions(
			[DServerCommand.createOption("count", DDataStructure.number())],
			{ dataStructureErrorInterpreter },
		);

		if (!DEither.isLeft(result)) {
			throw new Error("Expected execOptions to return a left.");
		}

		expect(dataStructureErrorInterpreter).toHaveBeenCalledTimes(1);
		expect(String(consoleErrorSpy.mock.calls[0]?.[0])).toContain("custom option message");
	});

	it("forbids duplicate option names", async() => {
		// @ts-expect-error duplicate option name must be rejected
		await DServerCommand.execOptions([
			DServerCommand.createBooleanOption("same"),
			DServerCommand.createOption("same", DDataStructure.string()),
		]);
	});
});
