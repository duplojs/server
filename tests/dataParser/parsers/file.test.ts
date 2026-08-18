import { type DP, E, type ExpectType, pipe, unwrap } from "@duplojs/utils";
import { DServerDataParser, DServerFile } from "@scripts";
import type { FileInterface } from "@scripts/file";

describe("dataParser.file", () => {
	it("creates a synchronous file parser with the expected input and output types", () => {
		const parser = DServerDataParser.file();

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

		expect(parser.definition).toStrictEqual({
			coerce: false,
			checkers: [],
			errorMessage: undefined,
		});
		expect(parser.isAsynchronous()).toBe(false);
	});

	it("accepts a file interface", () => {
		const file = DServerFile.createFileInterface("/tmp/demo.txt");
		const result = DServerDataParser.file().parse(file);

		type _CheckResult = ExpectType<
			typeof result,
			E.Error<DP.DataParserError> | E.Success<FileInterface>,
			"strict"
		>;

		expect(result).toStrictEqual(E.success(file));
	});

	it("rejects values that are not file interfaces", () => {
		const result = DServerDataParser.file({
			errorMessage: "invalid-file",
		}).parse({ path: "/tmp/demo.txt" });

		expect(E.isLeft(result)).toBe(true);
		if (E.isLeft(result)) {
			expect(unwrap(result).issues[0]?.message).toBe("invalid-file");
		}
	});

	it("accepts eligible file checkers in definition and addChecker", () => {
		const parser = DServerDataParser.file({
			checkers: [DServerDataParser.checkerFileExist()],
		}).addChecker(
			DServerDataParser.checkerFileMimeType(/^text\/plain$/),
		);

		expect(parser.definition.checkers).toHaveLength(2);
	});

	it("works in pipe", () => {
		const parser = pipe(
			{ errorMessage: "invalid-file" },
			DServerDataParser.file,
		);
		const file = DServerFile.createFileInterface("/tmp/demo.txt");

		expect(parser.parse(file)).toStrictEqual(E.success(file));
	});
});
