import { type DP, E, type ExpectType, pipe } from "@duplojs/utils";
import { DServerDataParser, DServerFile, TESTImplementation, setEnvironment } from "@scripts";
import type { FileInterface } from "@scripts/file";

describe("dataParser.extended.file", () => {
	afterEach(() => {
		TESTImplementation.clear();
	});

	it("creates an extended file parser with expected input and output types", () => {
		const parser = DServerDataParser.extended.file();
		const file = DServerFile.createFileInterface("/tmp/demo.txt");

		type _CheckInput = ExpectType<
			DP.Input<typeof parser>,
			FileInterface,
			"strict"
		>;
		type _CheckOutput = ExpectType<
			DP.Output<typeof parser>,
			FileInterface,
			"strict"
		>;

		expect(parser.parse(file)).toStrictEqual(E.success(file));
		expect(parser.isAsynchronous()).toBe(false);
	});

	it("adds a mime type checker with the mimeType helper", () => {
		const parser = DServerDataParser.extended.file()
			.mimeType(/^text\/plain$/);

		type _CheckChecker = ExpectType<
			typeof parser.definition.checkers,
			readonly [DServerDataParser.DataParserCheckerFileMimeType],
			"strict"
		>;

		expect(parser.parse(
			DServerFile.createFileInterface("/tmp/demo.txt"),
		)).toStrictEqual(E.success(expect.any(Object)));
		expect(E.isLeft(parser.parse(
			DServerFile.createFileInterface("/tmp/demo.json"),
		))).toBe(true);
	});

	it("adds an asynchronous existence checker with the exist helper", async() => {
		setEnvironment("TEST");
		TESTImplementation.set("stat", vi.fn().mockResolvedValue(E.success({
			isFile: true,
		} as never)));
		const parser = DServerDataParser.extended.file().exist();
		const file = DServerFile.createFileInterface("/tmp/demo.txt");

		expect(parser.isAsynchronous()).toBe(true);
		expect(await parser.asyncParse(file)).toStrictEqual(E.success(file));
	});

	it("adds an asynchronous size checker with the size helper", async() => {
		setEnvironment("TEST");
		TESTImplementation.set("stat", vi.fn().mockResolvedValue(E.success({
			isFile: true,
			sizeBytes: 5,
		} as never)));
		const parser = DServerDataParser.extended.file()
			.size({
				min: 1,
				max: 10,
			});
		const file = DServerFile.createFileInterface("/tmp/demo.txt");

		expect(parser.isAsynchronous()).toBe(true);
		expect(await parser.asyncParse(file)).toStrictEqual(E.success(file));
	});

	it("chains file helpers and works in pipe", async() => {
		setEnvironment("TEST");
		TESTImplementation.set("stat", vi.fn().mockResolvedValue(E.success({
			isFile: true,
			sizeBytes: 5,
		} as never)));
		const parser = pipe(
			{ errorMessage: "invalid-file" },
			DServerDataParser.extended.file,
		)
			.mimeType(/^application\/json$/)
			.size({ max: 10 })
			.exist();
		const file = DServerFile.createFileInterface("/tmp/demo.json");

		type _CheckOutput = ExpectType<
			DP.Output<typeof parser>,
			FileInterface,
			"strict"
		>;

		expect(parser.definition.checkers).toHaveLength(3);
		expect(await parser.asyncParse(file)).toStrictEqual(E.success(file));
	});
});
