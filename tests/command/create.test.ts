import type * as DCommon from "@duplojs/lang/common";
import * as DDataStructure from "@duplojs/lang/dataStructure";
import { DServerCommand, TESTImplementation, setEnvironment } from "@scripts";

describe("create", () => {
	afterEach(() => {
		setEnvironment("NODE");
		TESTImplementation.clear();
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	it("identifies command tuples", () => {
		const command = DServerCommand.create("child", () => undefined);
		const argument = DServerCommand.createArgument("id", DDataStructure.string());

		expect(DServerCommand.isCommands([command])).toBe(true);
		expect(DServerCommand.isCommands([argument])).toBe(false);
		expect(DServerCommand.isCommands("command")).toBe(false);
	});

	it("creates a command without params", () => {
		const command = DServerCommand.create("root", () => undefined);

		type _CheckCommand = DCommon.ExpectType<
			typeof command,
			DServerCommand.Command<"root">,
			"strict"
		>;

		expect(command.name).toBe("root");
		expect(command.description).toBeNull();
		expect(command.options).toEqual([]);
		expect(command.subject).toBeNull();
	});

	it("creates a command with options and argument subjects", () => {
		const verbose = DServerCommand.createBooleanOption("verbose", {
			description: "Enable verbose logs.",
			aliases: ["v"],
		});
		const id = DServerCommand.createArgument(
			"id",
			DDataStructure.number(),
			{ description: "Resource id." },
		);

		const command = DServerCommand.create(
			"read",
			{
				description: "Read a resource.",
				options: [verbose],
				subjects: [id],
			},
			() => undefined,
		);

		expect(command.description).toBe("Read a resource.");
		expect(command.options).toEqual([verbose]);
		expect(command.subject).toEqual({
			type: "argument",
			args: [id],
		});
	});

	it("creates a command with sub-command subjects", () => {
		const child = DServerCommand.create("child", () => undefined);

		const command = DServerCommand.create(
			"root",
			{ subjects: [child] },
			() => undefined,
		);

		expect(command.subject).toEqual({
			type: "subCommand",
			subCommands: [child],
		});
	});

	it("executes a command without params", async() => {
		setEnvironment("TEST");
		const executeSpy = vi.fn();
		const command = DServerCommand.create("root", executeSpy);
		const error = DServerCommand.createError("root");

		await expect(command.execute([], error)).resolves.toBeUndefined();

		expect(executeSpy).toHaveBeenCalledTimes(1);
		expect(error.issues).toEqual([]);
	});

	it("executes with parsed options and arguments", async() => {
		setEnvironment("TEST");
		const executeSpy = vi.fn();

		const command = DServerCommand.create(
			"root",
			{
				options: [
					DServerCommand.createBooleanOption("verbose"),
					DServerCommand.createOption("name", DDataStructure.string(), { required: true }),
				],
				subjects: [
					DServerCommand.createArgument("id", DDataStructure.number()),
					DServerCommand.createArgument("tag", DDataStructure.string(), { optional: true }),
				],
			},
			({ options, args }) => {
				type _CheckOptions = DCommon.ExpectType<
					typeof options,
					{
						readonly verbose: boolean;
						readonly name: string;
					},
					"strict"
				>;

				type _CheckArgs = DCommon.ExpectType<
					typeof args,
					{
						readonly id: number;
						readonly tag: string | undefined;
					},
					"strict"
				>;

				executeSpy({
					options,
					args,
				});
			},
		);

		await expect(
			command.execute(["--verbose", "--name", "duplo", "42", "release"], DServerCommand.createError("root")),
		).resolves.toBeUndefined();

		expect(executeSpy).toHaveBeenCalledWith({
			options: {
				verbose: true,
				name: "duplo",
			},
			args: {
				id: 42,
				tag: "release",
			},
		});
	});

	it("executes with empty params and exposes no typed execute params", async() => {
		setEnvironment("TEST");
		const executeSpy = vi.fn();

		const command = DServerCommand.create(
			"root",
			{},
			(params) => {
				type _CheckParams = DCommon.ExpectType<
					typeof params,
					{},
					"strict"
				>;

				executeSpy(params);
			},
		);

		await expect(command.execute([], DServerCommand.createError("root"))).resolves.toBeUndefined();

		expect(executeSpy).toHaveBeenCalledWith({
			options: {},
		});
	});

	it("executes the matching sub-command with shifted arguments and path", async() => {
		setEnvironment("TEST");
		const childSpy = vi.fn();
		const rootSpy = vi.fn();
		const error = DServerCommand.createError("root");

		const child = DServerCommand.create(
			"child",
			{
				subjects: [DServerCommand.createArgument("id", DDataStructure.number())],
			},
			({ args }) => childSpy(args),
		);
		const root = DServerCommand.create("root", { subjects: [child] }, () => rootSpy());

		await expect(root.execute(["child", "42"], error)).resolves.toBeUndefined();

		expect(childSpy).toHaveBeenCalledWith({ id: 42 });
		expect(rootSpy).not.toHaveBeenCalled();
		expect(error.currentPath).toEqual(["root", "child"]);
		expect(error.issues).toEqual([]);
	});

	it("reports unexpected arguments when no sub-command matches", async() => {
		setEnvironment("TEST");
		const error = DServerCommand.createError("root");
		const child = DServerCommand.create("child", () => undefined);
		const root = DServerCommand.create("root", { subjects: [child] }, () => undefined);

		await expect(root.execute(["unknown"], error)).resolves.toBe(DServerCommand.SymbolCommandError);

		expect(error.currentPath).toEqual(["root"]);
		expect(error.issues).toEqual([
			expect.objectContaining({
				expect: 0,
				receive: 1,
				path: "root",
			}),
		]);
	});

	it("reports unexpected arguments when the command has no subject", async() => {
		setEnvironment("TEST");
		const error = DServerCommand.createError("root");
		const command = DServerCommand.create("root", () => undefined);

		await expect(command.execute(["extra", "args"], error)).resolves.toBe(DServerCommand.SymbolCommandError);

		expect(error.issues).toEqual([
			expect.objectContaining({
				expect: 0,
				receive: 2,
			}),
		]);
	});

	it("logs help and skips the execute handler", async() => {
		setEnvironment("TEST");
		const executeSpy = vi.fn();
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

		const command = DServerCommand.create(
			"root",
			{
				description: "Root command.",
				options: [DServerCommand.createBooleanOption("verbose")],
				subjects: [DServerCommand.createArgument("name", DDataStructure.string())],
			},
			executeSpy,
		);

		await expect(command.execute(["-h"], DServerCommand.createError("root"))).resolves.toBeUndefined();

		expect(executeSpy).not.toHaveBeenCalled();
		expect(consoleLogSpy).toHaveBeenCalledTimes(1);
		expect(String(consoleLogSpy.mock.calls[0]?.[0])).toContain("Root command.");
		expect(String(consoleLogSpy.mock.calls[0]?.[0])).toContain("verbose");
	});

	it("returns a command error when the help option is malformed", async() => {
		setEnvironment("TEST");
		const error = DServerCommand.createError("root");
		const command = DServerCommand.create("root", () => undefined);

		await expect(command.execute(["--help=true"], error)).resolves.toBe(DServerCommand.SymbolCommandError);

		expect(error.issues).toEqual([
			expect.objectContaining({
				optionName: "help",
				data: "true",
				path: "root",
			}),
		]);
	});

	it("returns a command error when an option fails", async() => {
		setEnvironment("TEST");
		const executeSpy = vi.fn();
		const error = DServerCommand.createError("root");
		const command = DServerCommand.create(
			"root",
			{
				options: [DServerCommand.createOption("name", DDataStructure.string(), { required: true })],
			},
			executeSpy,
		);

		await expect(command.execute([], error)).resolves.toBe(DServerCommand.SymbolCommandError);

		expect(executeSpy).not.toHaveBeenCalled();
		expect(error.issues).toEqual([
			expect.objectContaining({
				optionName: "name",
				path: "root",
			}),
		]);
	});

	it("returns a command error when the argument count mismatches", async() => {
		setEnvironment("TEST");
		const executeSpy = vi.fn();
		const error = DServerCommand.createError("root");
		const command = DServerCommand.create(
			"root",
			{
				subjects: [
					DServerCommand.createArgument("first", DDataStructure.string()),
					DServerCommand.createArgument("second", DDataStructure.string()),
				],
			},
			executeSpy,
		);

		await expect(command.execute(["only-one"], error)).resolves.toBe(DServerCommand.SymbolCommandError);

		expect(executeSpy).not.toHaveBeenCalled();
		expect(error.issues).toEqual([
			expect.objectContaining({
				expect: 2,
				receive: 1,
			}),
		]);
	});

	it("returns a command error when an argument fails", async() => {
		setEnvironment("TEST");
		const executeSpy = vi.fn();
		const error = DServerCommand.createError("root");
		const command = DServerCommand.create(
			"root",
			{
				subjects: [DServerCommand.createArgument("id", DDataStructure.number())],
			},
			executeSpy,
		);

		await expect(command.execute(["bad-id"], error)).resolves.toBe(DServerCommand.SymbolCommandError);

		expect(executeSpy).not.toHaveBeenCalled();
		expect(error.issues).toEqual([
			expect.objectContaining({
				argumentName: "id",
				data: "bad-id",
				path: "root",
			}),
		]);
	});

	it("does not catch execution errors", async() => {
		setEnvironment("TEST");
		const userError = new Error("user crash");
		const command = DServerCommand.create("root", () => {
			throw userError;
		});

		await expect(command.execute([], DServerCommand.createError("root"))).rejects.toThrow(userError);
	});

	it("forbids duplicate option names", () => {
		DServerCommand.create(
			"root",
			{
				// @ts-expect-error duplicate option name must be rejected
				options: [
					DServerCommand.createOption("same", DDataStructure.string()),
					DServerCommand.createBooleanOption("same"),
				],
			},
			() => undefined,
		);
	});

	it("forbids duplicate subject names", () => {
		DServerCommand.create(
			"root",
			{
				// @ts-expect-error duplicate argument name must be rejected
				subjects: [
					DServerCommand.createArgument("id", DDataStructure.number()),
					DServerCommand.createArgument("id", DDataStructure.string()),
				],
			},
			() => undefined,
		);
	});

	it("forbids optional arguments before required arguments", () => {
		DServerCommand.create(
			"root",
			{
				// @ts-expect-error optional argument cannot be declared before a required argument
				subjects: [
					DServerCommand.createArgument("maybe", DDataStructure.string(), { optional: true }),
					DServerCommand.createArgument("required", DDataStructure.string()),
				],
			},
			() => undefined,
		);
	});

	it("does not expose sub-commands as execute arguments", () => {
		DServerCommand.create(
			"root",
			{
				subjects: [DServerCommand.create("child", () => undefined)],
			},
			(params) => {
				type _CheckParams = DCommon.ExpectType<
					typeof params,
					{},
					"strict"
				>;
			},
		);
	});
});
