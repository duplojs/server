import { type ExpectType, DP } from "@duplojs/utils";
import { DServerCommand, TESTImplementation, setEnvironment } from "@scripts";

describe("exec", () => {
	afterEach(() => {
		setEnvironment("NODE");
		TESTImplementation.clear();
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	it("executes root command without params", async() => {
		setEnvironment("TEST");
		const getProcessArgumentsSpy = vi.fn().mockReturnValue([]);
		const executeSpy = vi.fn();
		TESTImplementation.set("getProcessArguments", getProcessArgumentsSpy);

		const promise = DServerCommand.exec(executeSpy);

		type _CheckPromise = ExpectType<
			typeof promise,
			Promise<void>,
			"strict"
		>;

		await promise;

		expect(getProcessArgumentsSpy).toHaveBeenCalledTimes(1);
		expect(executeSpy).toHaveBeenCalledWith({ options: {} });
	});

	it("executes with options and wrapped arguments", async() => {
		setEnvironment("TEST");
		const getProcessArgumentsSpy = vi.fn().mockReturnValue(["--verbose", "subject"]);
		const executeSpy = vi.fn();
		TESTImplementation.set("getProcessArguments", getProcessArgumentsSpy);

		await DServerCommand.exec(
			{
				options: [DServerCommand.createBooleanOption("verbose")],
				subjects: [DServerCommand.createArgument("name", DP.string())],
			},
			(params) => {
				type _CheckOptions = ExpectType<
					typeof params.options,
					{ verbose: boolean },
					"strict"
				>;

				type _CheckArgs = ExpectType<
					typeof params.args,
					{ name: string },
					"strict"
				>;

				executeSpy(params);
			},
		);

		expect(executeSpy).toHaveBeenCalledWith({
			options: { verbose: true },
			args: { name: "subject" },
		});
	});

	it("prints interpreted error and exits with code 1 on command error", async() => {
		setEnvironment("TEST");
		const getProcessArgumentsSpy = vi.fn().mockReturnValue(["bad"]);
		const exitSpy = vi.fn();
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		TESTImplementation.set("getProcessArguments", getProcessArgumentsSpy);
		TESTImplementation.set("exitProcess", exitSpy);

		await DServerCommand.exec(
			{
				subjects: [DServerCommand.createArgument("id", DP.number())],
			},
			() => undefined,
		);

		expect(getProcessArgumentsSpy).toHaveBeenCalledTimes(1);
		expect(errorSpy).toHaveBeenCalledTimes(1);
		expect(String(errorSpy.mock.calls[0]?.[0])).toContain("Command failed");
		expect(exitSpy).toHaveBeenCalledWith(1);
	});
});
