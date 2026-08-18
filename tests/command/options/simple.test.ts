import { E, type ExpectType, C, DP, S, unwrap } from "@duplojs/utils";
import { DServerCommand, DServerDataParser, DServerFile, TESTImplementation, setEnvironment } from "@scripts";
import { createError, SymbolCommandError } from "@scripts/command/error";

describe("createOption", () => {
	afterEach(() => {
		setEnvironment("NODE");
		TESTImplementation.clear();
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	it("returns undefined when optional option is missing", async() => {
		const option = DServerCommand.createOption("name", DP.string());
		const result = await option.execute(["subject"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		type _CheckResult = ExpectType<
			typeof result.result,
			string | undefined,
			"strict"
		>;

		expect(result.result).toBeUndefined();
		expect(result.argumentRest).toEqual(["subject"]);
	});

	it("parses inline value for optional option", async() => {
		const option = DServerCommand.createOption("name", DP.string());
		const result = await option.execute(["--name=duplo", "subject"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		expect(result.result).toBe("duplo");
		expect(result.argumentRest).toEqual(["subject"]);
	});

	it("parses next argument value for optional option", async() => {
		const option = DServerCommand.createOption("name", DP.string());
		const result = await option.execute(["--name", "duplo", "subject"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		expect(result.result).toBe("duplo");
		expect(result.argumentRest).toEqual(["subject"]);
	});

	it("returns command error when required option is missing", async() => {
		const option = DServerCommand.createOption("name", DP.string(), { required: true });
		const error = createError("root");

		await expect(option.execute(["subject"], error)).resolves.toBe(SymbolCommandError);
		expect(error.issues[0]?.expected).toBe("required option --name");
	});

	it("parses value when required option is present", async() => {
		const option = DServerCommand.createOption("name", DP.string(), { required: true });
		const result = await option.execute(["--name=duplo", "subject"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		type _CheckResult = ExpectType<
			typeof result.result,
			string,
			"strict"
		>;

		expect(result.result).toBe("duplo");
		expect(result.argumentRest).toEqual(["subject"]);
	});

	it("returns command error when value cannot be parsed by schema", async() => {
		const option = DServerCommand.createOption("enabled", DP.boolean() as never);
		const error = createError("root");

		await expect(option.execute(["--enabled=yes"], error)).resolves.toBe(SymbolCommandError);
		expect(error.issues[0]?.expected).toBe("boolean");
	});

	it("supports transform schema and keeps transformed output type", async() => {
		const option = DServerCommand.createOption(
			"size",
			DP.transform(
				DP.string(),
				(value) => value.length,
			),
		);

		const result = await option.execute(["--size=duplo"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		type _CheckResult = ExpectType<
			typeof result.result,
			number | undefined,
			"strict"
		>;

		expect(result.result).toBe(5);
	});

	it("supports file data parser with path coercion without mutating original schema", async() => {
		const schema = DServerDataParser.file();
		const option = DServerCommand.createOption(
			"file",
			schema,
			{ required: true },
		);

		const result = await option.execute(["--file=/tmp/demo.txt"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		type _CheckResult = ExpectType<
			typeof result.result,
			DServerFile.FileInterface,
			"strict"
		>;

		expect(DServerFile.isFileInterface(result.result)).toBe(true);
		expect(result.result.path).toBe("/tmp/demo.txt");
		expect(schema.definition.coerce).toBe(false);
	});

	it("coerces eligible data parser without mutating original schema", async() => {
		const schema = DP.number();
		const option = DServerCommand.createOption(
			"count",
			schema,
		);

		const result = await option.execute(["--count=42"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		type _CheckResult = ExpectType<
			typeof result.result,
			number | undefined,
			"strict"
		>;

		expect(result.result).toBe(42);
		expect(schema.definition.coerce).toBe(false);
	});

	it("supports optional option with pipe schema without crashing at execute", async() => {
		const option = DServerCommand.createOption(
			"name",
			DP.transform(
				DP.string(),
				S.toLowerCase,
			),
		);

		const missingResult = await option.execute(["subject"], createError("root"));
		const result = await option.execute(["--name=PABLO"], createError("root"));
		expect(missingResult).not.toBe(SymbolCommandError);
		expect(result).not.toBe(SymbolCommandError);
		if (missingResult === SymbolCommandError || result === SymbolCommandError) {
			return;
		}

		type _CheckMissingResult = ExpectType<
			typeof missingResult.result,
			Lowercase<string> | undefined,
			"strict"
		>;

		type _CheckResult = ExpectType<
			typeof result.result,
			Lowercase<string> | undefined,
			"strict"
		>;

		expect(missingResult.result).toBeUndefined();
		expect(result.result).toBe("pablo");
		expect(result.argumentRest).toEqual([]);
	});

	it("supports pipe schema with file output data parser", async() => {
		const option = DServerCommand.createOption(
			"file",
			DP.pipe(
				DP.string(),
				DServerDataParser.coerce.file(),
			),
			{ required: true },
		);

		const result = await option.execute(["--file=/tmp/pipe.txt"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		type _CheckResult = ExpectType<
			typeof result.result,
			DServerFile.FileInterface,
			"strict"
		>;

		expect(DServerFile.isFileInterface(result.result)).toBe(true);
		expect(result.result.path).toBe("/tmp/pipe.txt");
	});

	it("supports asynchronous data parser option", async() => {
		setEnvironment("TEST");
		TESTImplementation.set("stat", vi.fn().mockResolvedValue(E.success({
			isFile: true,
			sizeBytes: 1,
		} as never)));

		const option = DServerCommand.createOption(
			"file",
			DServerDataParser.file({
				checkers: [DServerDataParser.checkerFileExist()],
			}),
			{ required: true },
		);

		const result = await option.execute(["--file=/tmp/async.txt"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		type _CheckResult = ExpectType<
			typeof result.result,
			DServerFile.FileInterface,
			"strict"
		>;

		expect(result.result.path).toBe("/tmp/async.txt");
	});

	it("supports clean primitive schema as contract", async() => {
		const option = DServerCommand.createOption(
			"count",
			C.Number,
		);

		const result = await option.execute(["--count=42"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		type _check = ExpectType<
			typeof result.result,
			C.Number | undefined,
			"strict"
		>;

		expect(unwrap(result.result)).toBe(42);
	});

	it("supports clean handler contracts", async() => {
		const constraintOption = DServerCommand.createOption(
			"count",
			C.Positive,
		);

		const constraintResult = await constraintOption.execute(["--count=42"], createError("root"));
		expect(constraintResult).not.toBe(SymbolCommandError);
		if (constraintResult === SymbolCommandError) {
			return;
		}

		type _checkConstraint = ExpectType<
			typeof constraintResult.result,
			C.Positive | undefined,
			"strict"
		>;

		const UserId = C.createNewType(
			"userId",
			DP.number(),
		);

		const newTypeOption = DServerCommand.createOption(
			"user",
			UserId,
			{ required: true },
		);

		const newTypeResult = await newTypeOption.execute(["--user=42"], createError("root"));
		expect(newTypeResult).not.toBe(SymbolCommandError);
		if (newTypeResult === SymbolCommandError) {
			return;
		}

		type _checkNewType = ExpectType<
			typeof newTypeResult.result,
			C.GetNewType<typeof UserId>,
			"strict"
		>;

		expect(unwrap(constraintResult.result)).toBe(42);
		expect(unwrap(newTypeResult.result)).toBe(42);
	});

	it("supports clean entity property definition contracts", async() => {
		const identifierOption = DServerCommand.createOption(
			"target",
			C.entityPropertyDefinitionTools.identifier("duplo"),
		);

		const identifierResult = await identifierOption.execute(["--target=duplo"], createError("root"));
		expect(identifierResult).not.toBe(SymbolCommandError);
		if (identifierResult === SymbolCommandError) {
			return;
		}

		type _checkIdentifier = ExpectType<
			typeof identifierResult.result,
			"duplo" | undefined,
			"strict"
		>;

		const unionOption = DServerCommand.createOption(
			"role",
			C.entityPropertyDefinitionTools.union(
				C.entityPropertyDefinitionTools.identifier("admin"),
				C.entityPropertyDefinitionTools.identifier("client"),
			),
		);

		const unionResult = await unionOption.execute(["--role=admin"], createError("root"));
		expect(unionResult).not.toBe(SymbolCommandError);
		if (unionResult === SymbolCommandError) {
			return;
		}

		type _checkUnion = ExpectType<
			typeof unionResult.result,
			"admin" | "client" | undefined,
			"strict"
		>;

		const nullableOption = DServerCommand.createOption(
			"target",
			C.entityPropertyDefinitionTools.nullable(
				C.entityPropertyDefinitionTools.identifier("duplo"),
			),
		);

		const nullableResult = await nullableOption.execute(["subject"], createError("root"));
		expect(nullableResult).not.toBe(SymbolCommandError);
		if (nullableResult === SymbolCommandError) {
			return;
		}

		type _checkNullable = ExpectType<
			typeof nullableResult.result,
			"duplo" | null | undefined,
			"strict"
		>;

		expect(identifierResult.result).toBe("duplo");
		expect(unionResult.result).toBe("admin");
		expect(nullableResult.result).toBeUndefined();
	});
});
