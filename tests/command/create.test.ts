import { DP, type ExpectType } from "@duplojs/utils";
import { DServerCommand, TESTImplementation, setEnvironment } from "@scripts";
import { SymbolCommandError, createError } from "@scripts/command/error";

describe("create", () => {
	afterEach(() => {
		setEnvironment("NODE");
		TESTImplementation.clear();
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	it("creates a command node", () => {
		const command = DServerCommand.create("root", () => undefined);

		type _CheckCommand = ExpectType<
			typeof command,
			DServerCommand.Command<"root">,
			"strict"
		>;

		expect(command.name).toBe("root");
		expect(command.description).toBeNull();
		expect(command.options).toEqual([]);
		expect(command.subject).toBeNull();
	});

	it("executes simple command", async() => {
		setEnvironment("TEST");
		const executeSpy = vi.fn();

		const command = DServerCommand.create("root", () => executeSpy());

		await expect(command.execute([], createError("root"))).resolves.toBeUndefined();
		expect(executeSpy).toHaveBeenCalledTimes(1);
	});

	it("infers options and wrapped args types", async() => {
		setEnvironment("TEST");
		const executeSpy = vi.fn();

		const command = DServerCommand.create(
			"root",
			{
				options: [
					DServerCommand.createBooleanOption("verbose"),
					DServerCommand.createOption("name", DP.string(), { required: true }),
				],
				subjects: [
					DServerCommand.createArgument("id", DP.number()),
					DServerCommand.createArgument("tag", DP.string(), { optional: true }),
				],
			},
			({ options, args }) => {
				type _CheckOptions = ExpectType<typeof options, {
					verbose: boolean;
					name: string;
				}, "strict">;
				type _CheckArgs = ExpectType<typeof args, {
					id: number;
					tag: string | undefined;
				}, "strict">;
				executeSpy({
					options,
					args,
				});
			},
		);

		await command.execute(["--verbose", "--name=duplo", "42", "x"], createError("root"));
		expect(executeSpy).toHaveBeenCalledWith({
			options: {
				verbose: true,
				name: "duplo",
			},
			args: {
				id: 42,
				tag: "x",
			},
		});
	});

	it("preserves declared argument order", async() => {
		setEnvironment("TEST");
		const executeSpy = vi.fn();

		const command = DServerCommand.create(
			"root",
			{
				subjects: [
					DServerCommand.createArgument("first", DP.string()),
					DServerCommand.createArgument("second", DP.string()),
				],
			},
			({ args }) => executeSpy(args),
		);

		await command.execute(["A", "B"], createError("root"));
		expect(executeSpy).toHaveBeenCalledWith({
			first: "A",
			second: "B",
		});
	});

	it("returns command error on argument count mismatch", async() => {
		setEnvironment("TEST");
		const error = createError("root");

		const command = DServerCommand.create(
			"root",
			{ subjects: [DServerCommand.createArgument("first", DP.string())] },
			() => undefined,
		);

		await expect(command.execute([], error)).resolves.toBe(SymbolCommandError);
		expect(error.issues[0]?.type).toBe("command");
	});

	it("returns pluralized command error on argument count mismatch", async() => {
		setEnvironment("TEST");
		const error = createError("root");

		const command = DServerCommand.create(
			"root",
			{
				subjects: [
					DServerCommand.createArgument("first", DP.string()),
					DServerCommand.createArgument("second", DP.string()),
				],
			},
			() => undefined,
		);

		await expect(command.execute(["only-one"], error)).resolves.toBe(SymbolCommandError);
		expect(error.issues[0]?.expected).toBe("2 declared arguments");
	});

	it("returns argument error when parsing fails", async() => {
		setEnvironment("TEST");
		const error = createError("root");

		const command = DServerCommand.create(
			"root",
			{ subjects: [DServerCommand.createArgument("id", DP.number())] },
			() => undefined,
		);

		await expect(command.execute(["bad"], error)).resolves.toBe(SymbolCommandError);
		expect(error.issues[0]?.type).toBe("argument");
		expect(error.issues[0]?.target).toBe("id");
	});

	it("dispatches to matching child command", async() => {
		setEnvironment("TEST");
		const childSpy = vi.fn();
		const rootSpy = vi.fn();

		const child = DServerCommand.create("child", () => childSpy());
		const root = DServerCommand.create("root", { subjects: [child] }, () => rootSpy());

		await root.execute(["child"], createError("root"));

		expect(childSpy).toHaveBeenCalledTimes(1);
		expect(rootSpy).not.toHaveBeenCalled();
	});

	it("returns unknown child command error", async() => {
		setEnvironment("TEST");
		const error = createError("root");

		const child = DServerCommand.create("child", () => undefined);
		const root = DServerCommand.create("root", { subjects: [child] }, () => undefined);

		await expect(root.execute(["unknown"], error)).resolves.toBe(SymbolCommandError);
		expect(error.issues[0]).toMatchObject({
			type: "command",
			expected: "existing child command",
			received: "unknown",
		});
	});

	it("returns unknown child command error for command without subject", async() => {
		setEnvironment("TEST");
		const error = createError("root");
		const command = DServerCommand.create("root", () => undefined);

		await expect(command.execute(["unknown"], error)).resolves.toBe(SymbolCommandError);
		expect(error.issues[0]?.type).toBe("command");
	});

	it("renders help and exits without executing handler", async() => {
		setEnvironment("TEST");
		const exitSpy = vi.fn();
		const executeSpy = vi.fn();
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
		TESTImplementation.set("exitProcess", exitSpy);

		const command = DServerCommand.create(
			"root",
			{
				description: "Root command",
				subjects: [DServerCommand.createArgument("name", DP.string())],
			},
			executeSpy,
		);

		await command.execute(["--help"], createError("root"));

		expect(executeSpy).not.toHaveBeenCalled();
		expect(logSpy).toHaveBeenCalledTimes(1);
		expect(String(logSpy.mock.calls[0]?.[0])).toContain("Root command");
		expect(exitSpy).toHaveBeenCalledWith(0);
	});

	it("returns option error when help option is malformed", async() => {
		setEnvironment("TEST");
		const error = createError("root");
		const command = DServerCommand.create("root", () => undefined);

		await expect(command.execute(["--help=true"], error)).resolves.toBe(SymbolCommandError);
		expect(error.issues[0]).toMatchObject({
			type: "option",
			target: "help",
		});
	});

	it("stops parsing next options after first option error", async() => {
		setEnvironment("TEST");
		const laterOptionSpy = vi.fn();
		const command = DServerCommand.create(
			"root",
			{
				options: [
					DServerCommand.createOption("enabled", DP.boolean() as never),
					DServerCommand.initOption("later", () => {
						laterOptionSpy();
						return true;
					}),
				],
			},
			() => undefined,
		);

		await expect(command.execute(["--enabled=yes"], createError("root"))).resolves.toBe(SymbolCommandError);
		expect(laterOptionSpy).not.toHaveBeenCalled();
	});

	it("does not catch user execution errors", async() => {
		setEnvironment("TEST");
		const userError = new Error("user crash");
		const command = DServerCommand.create("root", () => {
			throw userError;
		});

		await expect(command.execute([], createError("root"))).rejects.toThrow(userError);
	});

	it("forbids duplicate option names", () => {
		DServerCommand.createOption("same", DP.string());

		DServerCommand.create(
			"root",
			{
				// @ts-expect-error duplicate option name must be rejected at type level
				options: [
					DServerCommand.createOption("same", DP.string()),
					DServerCommand.createBooleanOption("same"),
				],
			},
			() => undefined,
		);
	});

	it("forbids duplicate argument names in subjects", () => {
		DServerCommand.create(
			"root",
			{
				// @ts-expect-error duplicate argument name must be rejected at type level
				subjects: [
					DServerCommand.createArgument("id", DP.number()),
					DServerCommand.createArgument("id", DP.string()),
				],
			},
			() => undefined,
		);
	});

	it("forbids optional argument before required argument", () => {
		DServerCommand.create(
			"root",
			{
				// @ts-expect-error optional argument cannot be declared before required argument
				subjects: [
					DServerCommand.createArgument("maybe", DP.string(), { optional: true }),
					DServerCommand.createArgument("required", DP.string()),
				],
			},
			() => undefined,
		);
	});

	it("isolate arg inference", () => {
		DServerCommand.create(
			"root",
			{
				subjects: [DServerCommand.createArgument("test", DP.string())],
			},
			({ args }) => {
				type check = ExpectType<
					typeof args,
					{
						test: string;
					},
					"strict"
				>;
			},
		);
	});

	it("isolate option inference", () => {
		DServerCommand.create(
			"root",
			{
				options: [DServerCommand.createBooleanOption("verbose")],
			},
			({ options }) => {
				type check = ExpectType<
					typeof options,
					{
						verbose: boolean;
					},
					"strict"
				>;
			},
		);
	});

	it("not infer command in args", () => {
		DServerCommand.create(
			"root",
			{
				subjects: [DServerCommand.create("tt", () => {})],
			},
			(params) => {
				type check = ExpectType<
					typeof params,
					{},
					"strict"
				>;
			},
		);
	});
});
