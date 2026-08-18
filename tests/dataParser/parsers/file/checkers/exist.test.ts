import { type DP, E, type ExpectType, pipe, unwrap } from "@duplojs/utils";
import { DServerDataParser, DServerFile, TESTImplementation, setEnvironment } from "@scripts";
import type { FileInterface } from "@scripts/file";

describe("dataParser.checkerFileExist", () => {
	afterEach(() => {
		TESTImplementation.clear();
	});

	it("creates an asynchronous checker with the expected input type", () => {
		const checker = DServerDataParser.checkerFileExist();

		type _CheckInput = ExpectType<
			DP.InputChecker<typeof checker>,
			FileInterface,
			"strict"
		>;

		expect(checker.isAsynchronous()).toBe(true);
		expect(checker.definition).toStrictEqual({});
	});

	it("accepts an existing regular file", async() => {
		setEnvironment("TEST");
		const statMock = TESTImplementation.set(
			"stat",
			vi.fn().mockResolvedValue(E.success({
				isFile: true,
			} as never)),
		);

		const file = DServerFile.createFileInterface("/tmp/demo.txt");
		const parser = DServerDataParser.file({
			checkers: [DServerDataParser.checkerFileExist()],
		});

		expect(await parser.asyncParse(file)).toStrictEqual(E.success(file));
		expect(statMock).toHaveBeenCalledWith("/tmp/demo.txt");
	});

	it("rejects a missing file", async() => {
		setEnvironment("TEST");
		TESTImplementation.set(
			"stat",
			vi.fn().mockResolvedValue(E.left("file-system-stat")),
		);

		const file = DServerFile.createFileInterface("/tmp/missing.txt");
		const result = await DServerDataParser.file({
			checkers: [DServerDataParser.checkerFileExist()],
		}).asyncParse(file);

		expect(E.isLeft(result)).toBe(true);
		if (E.isLeft(result)) {
			expect(unwrap(result).issues[0]?.expected).toBe("existing file");
		}
	});

	it("rejects an existing resource that is not a file", async() => {
		setEnvironment("TEST");
		TESTImplementation.set(
			"stat",
			vi.fn().mockResolvedValue(E.success({
				isFile: false,
			} as never)),
		);
		const file = DServerFile.createFileInterface("/tmp/folder");
		const result = await DServerDataParser.file({
			checkers: [DServerDataParser.checkerFileExist()],
		}).asyncParse(file);

		expect(E.isLeft(result)).toBe(true);
		if (E.isLeft(result)) {
			expect(unwrap(result).issues[0]?.expected).toBe("file");
		}
	});

	it("works in pipe", () => {
		const checker = pipe(
			{ errorMessage: "missing-file" },
			DServerDataParser.checkerFileExist,
		);

		expect(checker.definition.errorMessage).toBe("missing-file");
	});
});
