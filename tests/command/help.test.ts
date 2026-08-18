import { DP, Printer } from "@duplojs/utils";
import { DServerCommand, DServerDataParser } from "@scripts";
import { formatDataParser, logCommandHelp, logExecOptionHelp, renderArgumentsHelp, renderCommandHelp, renderExecOptionHelp } from "@scripts/command/help";

describe("help", () => {
	afterEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	it("renders name, description, options and arguments", () => {
		const command = DServerCommand.create(
			"root",
			{
				description: "Root command description",
				options: [
					DServerCommand.createBooleanOption("verbose", {
						aliases: ["v"],
						description: "Enable verbose mode",
					}),
				],
				subjects: [DServerCommand.createArgument("name", DP.string(), { description: "User name" })],
			},
			() => Promise.resolve(undefined),
		);

		const output = renderCommandHelp(command, 0).join("\n");

		expect(output).toContain("COMMAND:");
		expect(output).toContain("Root command description");
		expect(output).toContain("OPTIONS:");
		expect(output).toContain("--verbose");
		expect(output).toContain("Enable verbose mode");
		expect(output).toContain("ARGUMENTS:");
		expect(output).toContain("<name>");
		expect(output).toContain("name:");
		expect(output).toContain("User name");
	});

	it("recursively renders child commands", () => {
		const child = DServerCommand.create("child", () => Promise.resolve(undefined));
		const root = DServerCommand.create(
			"root",
			{ subjects: [child] },
			() => Promise.resolve(undefined),
		);

		const output = renderCommandHelp(root, 0).join("\n");
		expect(output).toContain("root");
		expect(output).toContain("child");
	});

	it("renders argument blocks", () => {
		const output = renderArgumentsHelp(
			[
				DServerCommand.createArgument("id", DP.number()),
				DServerCommand.createArgument("tag", DP.string(), { optional: true }),
			],
			1,
		);

		expect(output).toContain("ARGUMENTS:");
		expect(output).toContain("<?tag>");
		expect(output).toContain("id:");
		expect(output).toContain("number");
		expect(output).toContain("tag:");
		expect(output).toContain("string | undefined");
	});

	it("formats supported parser kinds", () => {
		expect(formatDataParser(DP.string())).toBe("string");
		expect(formatDataParser(DP.number())).toBe("number");
		expect(formatDataParser(DP.bigint())).toBe("bigint");
		expect(formatDataParser(DP.literal(["on", "off"] as const))).toBe("on | off");
		expect(formatDataParser(DP.templateLiteral(["id-", DP.number()]))).toBe("id-${number}");
		expect(formatDataParser(DP.union([DP.string(), DP.number()]))).toBe("string | number");
		expect(formatDataParser(DP.transform(DP.string(), (value) => value.length))).toBe("string");
		expect(
			formatDataParser(
				DP.pipe(
					DP.string(),
					DP.transform(DP.string(), (value) => value.length),
				),
			),
		).toBe("string");
		expect(formatDataParser(DP.optional(DP.number()))).toBe("number?");
		expect(formatDataParser(DP.array(DP.string()))).toBe("string[]");
		expect(formatDataParser(DP.tuple([DP.string(), DP.number()]))).toBe("[string, number]");
		expect(formatDataParser(DP.tuple([DP.string()], { rest: DP.number() }))).toBe("[string, ...number[]]");
		expect(formatDataParser(DP.tuple([] as never, { rest: DP.number() }))).toBe("[...number[]]");
		expect(formatDataParser(DServerDataParser.file())).toBe("file");
	});

	it("renders metadata for required sismple and array options", () => {
		const output = renderExecOptionHelp(
			[
				DServerCommand.createOption("name", DP.string(), { required: true }),
				DServerCommand.createArrayOption("ids", DP.number(), { required: true }),
			],
			0,
		).join("\n");

		expect(output).toContain("[string] required");
		expect(output).toContain("[number[]] required");
	});

	it("renders metadata for non-required options without required label", () => {
		const output = renderExecOptionHelp(
			[
				DServerCommand.createOption("name", DP.string()),
				DServerCommand.createArrayOption("ids", DP.number()),
			],
			0,
		).join("\n");

		expect(output).toContain("[string]");
		expect(output).toContain("[number[]]");
		expect(output).not.toContain("[string] required");
		expect(output).not.toContain("[number[]] required");
	});

	it("logs command help", () => {
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
		const command = DServerCommand.create("root", () => Promise.resolve(undefined));

		logCommandHelp(command);

		expect(logSpy).toHaveBeenCalledTimes(1);
		expect(String(logSpy.mock.calls[0]?.[0])).toContain("COMMAND:");
	});

	it("renders and logs exec options help", () => {
		const options = [DServerCommand.createBooleanOption("help", { aliases: ["h"] })];
		const lines = renderExecOptionHelp(options, 1);
		const output = Printer.renderParagraph(lines);
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

		expect(output).toContain("OPTION HELP");
		expect(output).toContain("--help");

		logExecOptionHelp(options);
		expect(logSpy).toHaveBeenCalledTimes(1);
	});
});
