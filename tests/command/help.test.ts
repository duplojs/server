import * as DDataStructure from "@duplojs/lang/dataStructure";
import { DServerCommand, DServerDataStructure } from "@scripts";

describe("help", () => {
	it("renders command help without subject or options", () => {
		const command = DServerCommand.create("root", () => undefined);

		const help = DServerCommand.renderCommandHelp(command, 0).join("\n");

		expect(help).toContain("COMMAND");
		expect(help).toContain("root");
		expect(help).toContain("USAGE");
	});

	it("renders command help with arguments", () => {
		const command = DServerCommand.create(
			"root",
			{
				description: "Root command.",
				subjects: [
					DServerCommand.createArgument("required", DDataStructure.string(), {
						description: "Required argument.",
					}),
					DServerCommand.createArgument("optional", DDataStructure.number(), {
						description: "Optional argument.",
						optional: true,
					}),
				],
			},
			() => undefined,
		);

		const help = DServerCommand.renderCommandHelp(command, 0).join("\n");

		expect(help).toContain("Root command.");
		expect(help).toContain("ARGUMENTS");
		expect(help).toContain("required");
		expect(help).toContain("optional");
		expect(help).toContain("Required argument.");
		expect(help).toContain("Optional argument.");
	});

	it("renders command help with sub-commands", () => {
		const childWithDescription = DServerCommand.create(
			"serve",
			{ description: "Start server." },
			() => undefined,
		);
		const childWithoutDescription = DServerCommand.create("build", () => undefined);
		const command = DServerCommand.create(
			"root",
			{ subjects: [childWithDescription, childWithoutDescription] },
			() => undefined,
		);

		const help = DServerCommand.renderCommandHelp(command, 0).join("\n");

		expect(help).toContain("COMMANDS");
		expect(help).toContain("serve");
		expect(help).toContain("Start server.");
		expect(help).toContain("build");
		expect(help).toContain("<command>");
	});

	it("renders options help for default option kinds", () => {
		const help = DServerCommand.renderOptionsHelp(
			[
				DServerCommand.createOption("name", DDataStructure.string(), {
					description: "User name.",
					aliases: ["n"],
					required: true,
				}),
				DServerCommand.createArrayOption("ids", DDataStructure.number(), {
					description: "Resource ids.",
					aliases: ["i"],
					min: 1,
					max: 3,
				}),
				DServerCommand.createBooleanOption("verbose", {
					description: "Enable verbose logs.",
					aliases: ["v"],
				}),
			],
			0,
		);

		expect(help).toContain("OPTIONS");
		expect(help).toContain("n");
		expect(help).toContain("name");
		expect(help).toContain("<value>");
		expect(help).toContain("User name.");
		expect(help).toContain("i");
		expect(help).toContain("ids");
		expect(help).toContain("<value...>");
		expect(help).toContain("Resource ids.");
		expect(help).toContain("v");
		expect(help).toContain("verbose");
		expect(help).toContain("Enable verbose logs.");
	});

	it("renders fallback option details for unknown option kinds", () => {
		const help = DServerCommand.renderOptionsHelp(
			[
				{
					name: "custom",
					description: "Custom option.",
					aliases: [],
				} as never,
			],
			0,
		);

		expect(help).toContain("custom");
		expect(help).toContain("Custom option.");
	});

	it("renders supported data structure types", () => {
		const help = DServerCommand.renderArgumentsHelp(
			[
				DServerCommand.createArgument("string", DDataStructure.string()),
				DServerCommand.createArgument("number", DDataStructure.number()),
				DServerCommand.createArgument("bigint", DDataStructure.bigint()),
				DServerCommand.createArgument("boolean", DDataStructure.boolean()),
				DServerCommand.createArgument("date", DDataStructure.date()),
				DServerCommand.createArgument("time", DDataStructure.time()),
				DServerCommand.createArgument("file", DServerDataStructure.file()),
				DServerCommand.createArgument("stringLiteral", DDataStructure.literal("value")),
				DServerCommand.createArgument("numberLiteral", DDataStructure.literal(42)),
				DServerCommand.createArgument("bigintLiteral", DDataStructure.literal(42n)),
				DServerCommand.createArgument("booleanLiteral", DDataStructure.literal(true)),
				DServerCommand.createArgument("nullLiteral", DDataStructure.literal(null)),
				DServerCommand.createArgument("undefinedLiteral", DDataStructure.literal(undefined)),
			],
			0,
		);

		expect(help).toContain("string");
		expect(help).toContain("number");
		expect(help).toContain("bigint");
		expect(help).toContain("boolean");
		expect(help).toContain("date");
		expect(help).toContain("time");
		expect(help).toContain("file");
		expect(help).toContain("\"value\"");
		expect(help).toContain("42");
		expect(help).toContain("42n");
		expect(help).toContain("true");
		expect(help).toContain("null");
		expect(help).toContain("undefined");
	});

	it("renders string, array and number constraints", () => {
		const help = DServerCommand.renderArgumentsHelp(
			[
				DServerCommand.createArgument("lengthEqual", DDataStructure.string([DDataStructure.stringLengthEqual(3)])),
				DServerCommand.createArgument("lengthRange", DDataStructure.string([DDataStructure.minCharacters(2), DDataStructure.maxCharacters(4)])),
				DServerCommand.createArgument("minLength", DDataStructure.string([DDataStructure.minCharacters(2)])),
				DServerCommand.createArgument("maxLength", DDataStructure.string([DDataStructure.maxCharacters(4)])),
				DServerCommand.createArgument("arrayEqual", DDataStructure.array(DDataStructure.string(), [DDataStructure.arrayLengthEqual(2)]) as never),
				DServerCommand.createArgument("arrayRange", DDataStructure.array(DDataStructure.string(), [DDataStructure.minElements(1), DDataStructure.maxElements(3)]) as never),
				DServerCommand.createArgument("arrayMin", DDataStructure.array(DDataStructure.string(), [DDataStructure.minElements(1)]) as never),
				DServerCommand.createArgument("arrayMax", DDataStructure.array(DDataStructure.string(), [DDataStructure.maxElements(3)]) as never),
				DServerCommand.createArgument("arrayItem", DDataStructure.array(DDataStructure.string([DDataStructure.minCharacters(2)])) as never),
				DServerCommand.createArgument("greater", DDataStructure.number([DDataStructure.greaterThan(1)])),
				DServerCommand.createArgument("greaterEqual", DDataStructure.number([DDataStructure.greaterThanOrEqual(1)])),
				DServerCommand.createArgument("less", DDataStructure.number([DDataStructure.lessThan(5)])),
				DServerCommand.createArgument("lessEqual", DDataStructure.number([DDataStructure.lessThanOrEqual(5)])),
			],
			0,
		);

		expect(help).toContain("length");
		expect(help).toContain("2..4");
		expect(help).toContain("min length");
		expect(help).toContain("max length");
		expect(help).toContain("items");
		expect(help).toContain("1..3");
		expect(help).toContain("min items");
		expect(help).toContain("max items");
		expect(help).toContain("> ");
		expect(help).toContain("min");
		expect(help).toContain("< ");
		expect(help).toContain("max");
	});

	it("renders simple constraints", () => {
		const help = DServerCommand.renderArgumentsHelp(
			[
				DServerCommand.createArgument("email", DDataStructure.string([DDataStructure.email()])),
				DServerCommand.createArgument("url", DDataStructure.string([DDataStructure.url()])),
				DServerCommand.createArgument("uuid", DDataStructure.string([DDataStructure.uuid()])),
				DServerCommand.createArgument("integer", DDataStructure.number([DDataStructure.integer()])),
				DServerCommand.createArgument("trimmed", DDataStructure.string([DDataStructure.trimmed()])),
				DServerCommand.createArgument("notEmpty", DDataStructure.string([DDataStructure.notEmpty()])),
				DServerCommand.createArgument("numberInString", DDataStructure.string([DDataStructure.numberInString()])),
				DServerCommand.createArgument("even", DDataStructure.number([DDataStructure.even()])),
				DServerCommand.createArgument("odd", DDataStructure.number([DDataStructure.odd()])),
				DServerCommand.createArgument("positive", DDataStructure.number([DDataStructure.positive()])),
				DServerCommand.createArgument("negative", DDataStructure.number([DDataStructure.negative()])),
				DServerCommand.createArgument("notZero", DDataStructure.number([DDataStructure.notZero()])),
				DServerCommand.createArgument("safe", DDataStructure.number([DDataStructure.safe()])),
				DServerCommand.createArgument("path", DDataStructure.string([DDataStructure.path()])),
				DServerCommand.createArgument("absolutePath", DDataStructure.string([DDataStructure.absolutePath()])),
				DServerCommand.createArgument("segmentPath", DDataStructure.string([DDataStructure.segmentPath()])),
				DServerCommand.createArgument("strictPositive", DDataStructure.number([DDataStructure.strictPositive()])),
				DServerCommand.createArgument("strictNegative", DDataStructure.number([DDataStructure.strictNegative()])),
				DServerCommand.createArgument("between", DDataStructure.number([DDataStructure.betweenThan(1, 5)])),
				DServerCommand.createArgument("range", DDataStructure.number([DDataStructure.betweenThanOrEqual(1, 5)])),
				DServerCommand.createArgument("multiple", DDataStructure.number([DDataStructure.multipleOf(3)])),
				DServerCommand.createArgument("regex", DDataStructure.string([DDataStructure.regex(/^a/)])),
				DServerCommand.createArgument("exist", DServerDataStructure.file([DServerDataStructure.exist()])),
				DServerCommand.createArgument("mime", DServerDataStructure.file([DServerDataStructure.mimeType(/^text\//)])),
			],
			0,
		);

		expect(help).toContain("email");
		expect(help).toContain("url");
		expect(help).toContain("uuid");
		expect(help).toContain("integer");
		expect(help).toContain("trimmed");
		expect(help).toContain("not empty");
		expect(help).toContain("number in string");
		expect(help).toContain("even");
		expect(help).toContain("odd");
		expect(help).toContain("positive");
		expect(help).toContain("negative");
		expect(help).toContain("not zero");
		expect(help).toContain("safe number");
		expect(help).toContain("path");
		expect(help).toContain("absolute path");
		expect(help).toContain("path segment");
		expect(help).toContain("range");
		expect(help).toContain("multiple of");
		expect(help).toContain("pattern");
		expect(help).toContain("exists");
		expect(help).toContain("mime");
	});

	it("renders file size constraints", () => {
		const help = DServerCommand.renderArgumentsHelp(
			[
				DServerCommand.createArgument("sizeRange", DServerDataStructure.file([
DServerDataStructure.size({
 min: 1024,
					max: 2048 
})
])),
				DServerCommand.createArgument("sizeMin", DServerDataStructure.file([DServerDataStructure.size({ min: 1024 })])),
				DServerCommand.createArgument("sizeMax", DServerDataStructure.file([DServerDataStructure.size({ max: 1536 })])),
				DServerCommand.createArgument("sizeAny", DServerDataStructure.file([DServerDataStructure.size({})])),
			],
			0,
		);

		expect(help).toContain("size");
		expect(help).toContain("1 KB..2 KB");
		expect(help).toContain("min size");
		expect(help).toContain("max size");
		expect(help).toContain("1.5 KB");
	});

	it("renders nested and union structures", () => {
		const help = DServerCommand.renderArgumentsHelp(
			[
				DServerCommand.createArgument("lazy", DDataStructure.lazy(() => DDataStructure.string([DDataStructure.minCharacters(2)]), [DDataStructure.maxCharacters(4)])),
				DServerCommand.createArgument("optionalOnly", DDataStructure.union([DDataStructure.undefined()])),
				DServerCommand.createArgument("optionalString", DDataStructure.union([DDataStructure.string(), DDataStructure.undefined()])),
				DServerCommand.createArgument("stringOrNumber", DDataStructure.union([DDataStructure.string(), DDataStructure.number()])),
			],
			0,
		);

		expect(help).toContain("lazy");
		expect(help).toContain("min length");
		expect(help).toContain("max length");
		expect(help).toContain("undefined");
		expect(help).toContain("string");
		expect(help).toContain("number");
		expect(help).toContain("|");
	});

	it("renders unknown structures and unknown types", () => {
		const unknownStructure = {
			definition: {
				constraints: [],
			},
		};
		const unknownTypeStructure = {
			definition: {
				type: {},
				constraints: [],
			},
			[DDataStructure.typeStructureKind.runTimeKey]: null,
		};

		const help = DServerCommand.renderArgumentsHelp(
			[
				DServerCommand.createArgument("unknownStructure", unknownStructure as never),
				DServerCommand.createArgument("unknownType", unknownTypeStructure as never),
			],
			0,
		);

		expect(help).toContain("unknownStructure");
		expect(help).toContain("unknownType");
		expect(help).toContain("unknown");
	});

	it("logs command and exec option help", () => {
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
		const command = DServerCommand.create(
			"root",
			{
				options: [DServerCommand.createBooleanOption("verbose")],
			},
			() => undefined,
		);

		DServerCommand.logCommandHelp(command);
		DServerCommand.logExecOptionHelp([DServerCommand.createBooleanOption("verbose")]);

		expect(consoleLogSpy).toHaveBeenCalledTimes(2);
		expect(String(consoleLogSpy.mock.calls[0]?.[0])).toContain("COMMAND");
		expect(String(consoleLogSpy.mock.calls[1]?.[0])).toContain("EXEC OPTIONS");
	});
});
