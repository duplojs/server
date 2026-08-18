import { E, type ExpectType, C, DP, pipe, S, unwrap, type AnyTuple } from "@duplojs/utils";
import { DServerCommand, DServerDataParser, type DServerFile, TESTImplementation, setEnvironment } from "@scripts";
import { createError, SymbolCommandError } from "@scripts/command/error";

describe("createArrayOption", () => {
	afterEach(() => {
		setEnvironment("NODE");
		TESTImplementation.clear();
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	it("returns undefined when optional option is missing", async() => {
		const option = DServerCommand.createArrayOption("tags", DP.string());

		type _checkOption = ExpectType<
			typeof option,
			DServerCommand.ArrayOption<"tags", string[] | undefined>,
			"strict"
		>;

		const result = await option.execute(["subject"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		type _checkResult = ExpectType<
			typeof result.result,
			string[] | undefined,
			"strict"
		>;

		expect(result.result).toBeUndefined();
		expect(result.argumentRest).toEqual(["subject"]);
	});

	it("parses comma separated inline values by default", async() => {
		const option = DServerCommand.createArrayOption("tags", DP.string());

		const result = await option.execute(["--tags=one,two", "subject"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		type check = ExpectType<
			typeof result,
			{
				result: string[] | undefined;
				argumentRest: readonly string[];
			},
			"strict"
		>;

		expect(result.result).toEqual(["one", "two"]);
		expect(result.argumentRest).toEqual(["subject"]);
	});

	it("parses next argument value with custom separator", async() => {
		const option = DServerCommand.createArrayOption("tags", DP.string(), { separator: "|" });

		const result = await option.execute(["--tags", "one|two", "subject"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		expect(result.result).toEqual(["one", "two"]);
		expect(result.argumentRest).toEqual(["subject"]);
	});

	it("handles present option without value", async() => {
		const option = DServerCommand.createArrayOption("tags", DP.string());
		const error = createError("root");

		await expect(option.execute(["--tags"], error)).resolves.toBe(SymbolCommandError);
		expect(error.issues[0]?.type).toBe("option");
	});

	it("returns command error when required option is missing", async() => {
		const option = DServerCommand.createArrayOption("tags", DP.string(), { required: true });
		const error = createError("root");

		await expect(option.execute(["subject"], error)).resolves.toBe(SymbolCommandError);
		expect(error.issues[0]?.expected).toBe("required option --tags");
	});

	it("returns command error when min checker is not satisfied", async() => {
		const option = DServerCommand.createArrayOption("tags", DP.string(), { min: 2 });
		const error = createError("root");

		await expect(option.execute(["--tags=one"], error)).resolves.toBe(SymbolCommandError);
		expect(error.issues[0]?.expected).toBe("array.length >= 2");
	});

	it("returns command error when max checker is exceeded", async() => {
		const option = DServerCommand.createArrayOption("tags", DP.string(), { max: 1 });
		const error = createError("root");

		await expect(option.execute(["--tags=one,two"], error)).resolves.toBe(SymbolCommandError);
		expect(error.issues[0]?.expected).toBe("array.length <= 1");
	});

	it("supports aliases", async() => {
		const option = DServerCommand.createArrayOption("tags", DP.string(), { aliases: ["t"] });

		const result = await option.execute(["-t=one,two", "subject"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		expect(result.result).toEqual(["one", "two"]);
		expect(result.argumentRest).toEqual(["subject"]);
	});

	it("works when called from pipe", async() => {
		const option = DServerCommand.createArrayOption("tags", DP.string());

		const result = await pipe(["--tags=one,two"], (args) => option.execute(args, createError("root")));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		expect(result.result).toEqual(["one", "two"]);
	});

	it("supports transform and pipe schemas with typed array output", async() => {
		const option = DServerCommand.createArrayOption(
			"sizes",
			DP.pipe(
				DP.string(),
				DP.transform(
					DP.string(),
					S.length,
				),
			),
			{ required: true },
		);

		const result = await option.execute(["--sizes=duplo,js"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		type _CheckResult = ExpectType<
			typeof result.result,
			number[],
			"strict"
		>;

		expect(result.result).toEqual([5, 2]);
		expect(result.argumentRest).toEqual([]);
	});

	it("supports clean handler contracts with typed array output", async() => {
		const numberOption = DServerCommand.createArrayOption(
			"counts",
			C.Number,
			{
				required: true,
				min: 1,
			},
		);

		const numberResult = await numberOption.execute(["--counts=42,43"], createError("root"));
		expect(numberResult).not.toBe(SymbolCommandError);
		if (numberResult === SymbolCommandError) {
			return;
		}

		type _checkNumberResult = ExpectType<
			typeof numberResult.result,
			[C.Number, ...C.Number[]],
			"strict"
		>;

		const UserId = C.createNewType(
			"userId",
			DP.number(),
		);
		const userOption = DServerCommand.createArrayOption(
			"users",
			UserId,
			{ required: true },
		);

		const userResult = await userOption.execute(["--users=1,2"], createError("root"));
		expect(userResult).not.toBe(SymbolCommandError);
		if (userResult === SymbolCommandError) {
			return;
		}

		type _checkUserResult = ExpectType<
			typeof userResult.result,
			C.GetNewType<typeof UserId>[],
			"strict"
		>;

		expect(numberResult.result.map(unwrap)).toEqual([42, 43]);
		expect(userResult.result.map(unwrap)).toEqual([1, 2]);
	});

	it("supports file data parser with path coercion for array values without mutating original schema", async() => {
		const schema = DServerDataParser.file();
		const option = DServerCommand.createArrayOption(
			"files",
			schema,
			{
				required: true,
				min: 1,
			},
		);

		const result = await option.execute(["--files=/tmp/a.txt,/tmp/b.txt"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		type _CheckResult = ExpectType<
			typeof result.result,
			[DServerFile.FileInterface, ...DServerFile.FileInterface[]],
			"strict"
		>;

		expect(result.result.map((file) => file.path)).toEqual(["/tmp/a.txt", "/tmp/b.txt"]);
		expect(schema.definition.coerce).toBe(false);
	});

	it("supports pipe schema with file output data parser for array values", async() => {
		const option = DServerCommand.createArrayOption(
			"files",
			DP.pipe(
				DP.string(),
				DServerDataParser.coerce.file(),
			),
			{
				required: true,
				min: 1,
			},
		);

		const result = await option.execute(["--files=/tmp/pipe-a.txt,/tmp/pipe-b.txt"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		type _CheckResult = ExpectType<
			typeof result.result,
			[DServerFile.FileInterface, ...DServerFile.FileInterface[]],
			"strict"
		>;

		expect(result.result.map((file) => file.path)).toEqual(["/tmp/pipe-a.txt", "/tmp/pipe-b.txt"]);
	});

	it("supports asynchronous data parser option for array values", async() => {
		setEnvironment("TEST");
		TESTImplementation.set("stat", vi.fn().mockResolvedValue(E.success({
			isFile: true,
			sizeBytes: 1,
		} as never)));

		const option = DServerCommand.createArrayOption(
			"files",
			DServerDataParser.file({
				checkers: [DServerDataParser.checkerFileExist()],
			}),
			{
				required: true,
				min: 1,
			},
		);

		const result = await option.execute(["--files=/tmp/async-a.txt,/tmp/async-b.txt"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		type _CheckResult = ExpectType<
			typeof result.result,
			[DServerFile.FileInterface, ...DServerFile.FileInterface[]],
			"strict"
		>;

		expect(result.result.map((file) => file.path)).toEqual(["/tmp/async-a.txt", "/tmp/async-b.txt"]);
	});

	it("supports clean entity property definition contracts with typed array output", async() => {
		const option = DServerCommand.createArrayOption(
			"roles",
			C.entityPropertyDefinitionTools.union(
				C.entityPropertyDefinitionTools.identifier("admin"),
				C.entityPropertyDefinitionTools.identifier("client"),
			),
		);

		const result = await option.execute(["--roles=admin,client"], createError("root"));
		expect(result).not.toBe(SymbolCommandError);
		if (result === SymbolCommandError) {
			return;
		}

		type _checkResult = ExpectType<
			typeof result.result,
			("admin" | "client")[] | undefined,
			"strict"
		>;

		expect(result.result).toEqual(["admin", "client"]);
	});
});
