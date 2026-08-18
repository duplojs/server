import { DP, type ExpectType } from "@duplojs/utils";
import { DServerCommand, TESTImplementation, setEnvironment } from "@scripts";

describe("execOptions", () => {
	afterEach(() => {
		setEnvironment("NODE");
		TESTImplementation.clear();
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	it("returns empty options when no options are provided", async() => {
		setEnvironment("TEST");
		const getProcessArgumentsSpy = vi.fn().mockReturnValue([]);
		TESTImplementation.set("getProcessArguments", getProcessArgumentsSpy);

		const result = await DServerCommand.execOptions(DServerCommand.createBooleanOption("test"));

		type _CheckResult = ExpectType<
			typeof result,
			{
				test: boolean;
			},
			"strict"
		>;

		expect(getProcessArgumentsSpy).toHaveBeenCalledTimes(1);
		expect(result).toEqual({ test: false });
	});

	it("executes a single boolean option successfully", async() => {
		setEnvironment("TEST");
		const getProcessArgumentsSpy = vi.fn().mockReturnValue(["--verbose"]);
		TESTImplementation.set("getProcessArguments", getProcessArgumentsSpy);

		const verboseOption = DServerCommand.createBooleanOption("verbose");
		const result = await DServerCommand.execOptions(verboseOption);

		expect(getProcessArgumentsSpy).toHaveBeenCalledTimes(1);
		expect(result).toEqual({
			verbose: true,
		});
	});

	it("logs dedicated execOption help and exits when builtin help is used", async() => {
		setEnvironment("TEST");
		const getProcessArgumentsSpy = vi.fn().mockReturnValue(["-h"]);
		const exitSpy = vi.fn();
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
		TESTImplementation.set("getProcessArguments", getProcessArgumentsSpy);
		TESTImplementation.set("exitProcess", exitSpy);

		await DServerCommand.execOptions(DServerCommand.createBooleanOption("verbose"));

		expect(getProcessArgumentsSpy).toHaveBeenCalledTimes(1);
		expect(consoleLogSpy).toHaveBeenCalledTimes(1);
		expect(String(consoleLogSpy.mock.calls[0]?.[0])).toContain("OPTION HELP");
		expect(String(consoleLogSpy.mock.calls[0]?.[0])).toContain("--verbose");
		expect(exitSpy).toHaveBeenCalledWith(0);
	});

	it("logs an error and exits when builtin help is malformed", async() => {
		setEnvironment("TEST");
		const getProcessArgumentsSpy = vi.fn().mockReturnValue(["--help=true"]);
		const exitSpy = vi.fn();
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		TESTImplementation.set("getProcessArguments", getProcessArgumentsSpy);
		TESTImplementation.set("exitProcess", exitSpy);

		const result = await DServerCommand.execOptions(DServerCommand.createBooleanOption("verbose"));

		expect(getProcessArgumentsSpy).toHaveBeenCalledTimes(1);
		expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
		expect(String(consoleErrorSpy.mock.calls[0]?.[0])).toContain("option without value --help");
		expect(exitSpy).toHaveBeenCalledWith(1);
		expect(result).toBeUndefined();
	});

	it("executes multiple options successfully", async() => {
		setEnvironment("TEST");
		const getProcessArgumentsSpy = vi.fn().mockReturnValue(["--verbose", "--debug"]);
		TESTImplementation.set("getProcessArguments", getProcessArgumentsSpy);

		const verboseOption = DServerCommand.createBooleanOption("verbose");
		const debugOption = DServerCommand.createBooleanOption("debug");
		const result = await DServerCommand.execOptions(verboseOption, debugOption);

		expect(getProcessArgumentsSpy).toHaveBeenCalledTimes(1);
		expect(result).toEqual({
			verbose: true,
			debug: true,
		});
	});

	it("exits with error when option parsing fails", async() => {
		setEnvironment("TEST");
		const getProcessArgumentsSpy = vi.fn().mockReturnValue(["--count", "invalid"]);
		const exitSpy = vi.fn();
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		TESTImplementation.set("getProcessArguments", getProcessArgumentsSpy);
		TESTImplementation.set("exitProcess", exitSpy);

		const countOption = DServerCommand.createOption("count", DP.number());
		const result = await DServerCommand.execOptions(countOption);

		expect(getProcessArgumentsSpy).toHaveBeenCalledTimes(1);
		expect(consoleErrorSpy).toHaveBeenCalled();
		expect(exitSpy).toHaveBeenCalledWith(1);
		expect(result).toBeUndefined();
	});

	it("returns options with unmatched arguments", async() => {
		setEnvironment("TEST");
		const getProcessArgumentsSpy = vi.fn().mockReturnValue(["--verbose", "remaining", "args"]);
		TESTImplementation.set("getProcessArguments", getProcessArgumentsSpy);

		const verboseOption = DServerCommand.createBooleanOption("verbose");
		const result = await DServerCommand.execOptions(verboseOption);

		expect(getProcessArgumentsSpy).toHaveBeenCalledTimes(1);
		expect(result).toEqual({
			verbose: true,
		});
	});
});
