import { type DP, E, type ExpectType, pipe, unwrap } from "@duplojs/utils";
import { DServerDataParser, DServerFile, TESTImplementation, setEnvironment } from "@scripts";
import type { FileInterface } from "@scripts/file";

describe("dataParser.checkerFileSize", () => {
	afterEach(() => {
		TESTImplementation.clear();
	});

	it("creates an asynchronous checker with expected definition and input type", () => {
		const checker = DServerDataParser.checkerFileSize({
			min: 1,
			max: 10,
		});

		type _CheckInput = ExpectType<
			DP.InputChecker<typeof checker>,
			FileInterface,
			"strict"
		>;

		expect(checker.isAsynchronous()).toBe(true);
		expect(checker.definition).toStrictEqual({
			min: 1,
			max: 10,
		});
	});

	it("accepts file sizes inside inclusive bounds", async() => {
		setEnvironment("TEST");
		const statMock = TESTImplementation.set(
			"stat",
			vi.fn().mockResolvedValue(E.success({
				isFile: true,
				sizeBytes: 10,
			} as never)),
		);

		const file = DServerFile.createFileInterface("/tmp/demo.txt");
		const parser = DServerDataParser.file({
			checkers: [
				DServerDataParser.checkerFileSize({
					min: 10,
					max: 10,
				}),
			],
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
			checkers: [DServerDataParser.checkerFileSize({ max: 10 })],
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
				sizeBytes: 5,
			} as never)),
		);

		const file = DServerFile.createFileInterface("/tmp/folder");
		const result = await DServerDataParser.file({
			checkers: [DServerDataParser.checkerFileSize({ max: 10 })],
		}).asyncParse(file);

		expect(E.isLeft(result)).toBe(true);
		if (E.isLeft(result)) {
			expect(unwrap(result).issues[0]?.expected).toBe("file");
		}
	});

	it("rejects a file above the maximum size", async() => {
		setEnvironment("TEST");
		TESTImplementation.set(
			"stat",
			vi.fn().mockResolvedValue(E.success({
				isFile: true,
				sizeBytes: 11,
			} as never)),
		);

		const file = DServerFile.createFileInterface("/tmp/demo.txt");
		const result = await DServerDataParser.file({
			checkers: [DServerDataParser.checkerFileSize({ max: 10 })],
		}).asyncParse(file);

		expect(E.isLeft(result)).toBe(true);
		if (E.isLeft(result)) {
			expect(unwrap(result).issues[0]?.expected).toBe("file with sizeBytes <= 10");
		}
	});

	it("rejects a file below the minimum size", async() => {
		setEnvironment("TEST");
		TESTImplementation.set(
			"stat",
			vi.fn().mockResolvedValue(E.success({
				isFile: true,
				sizeBytes: 4,
			} as never)),
		);

		const file = DServerFile.createFileInterface("/tmp/demo.txt");
		const result = await DServerDataParser.file({
			checkers: [DServerDataParser.checkerFileSize({ min: 5 })],
		}).asyncParse(file);

		expect(E.isLeft(result)).toBe(true);
		if (E.isLeft(result)) {
			expect(unwrap(result).issues[0]?.expected).toBe("file with sizeBytes >= 5");
		}
	});

	it("works in pipe", () => {
		const checker = pipe(
			{
				min: 1,
				max: 10,
			},
			DServerDataParser.checkerFileSize,
		);

		expect(checker.definition.min).toBe(1);
		expect(checker.definition.max).toBe(10);
	});
});
