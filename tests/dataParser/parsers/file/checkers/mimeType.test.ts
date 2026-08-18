import { type DP, E, type ExpectType, pipe, unwrap } from "@duplojs/utils";
import { DServerDataParser, DServerFile } from "@scripts";
import type { FileInterface } from "@scripts/file";

describe("dataParser.checkerFileMimeType", () => {
	it("creates a synchronous checker with expected definition and input type", () => {
		const mimeType = /^text\/plain$/;
		const checker = DServerDataParser.checkerFileMimeType(mimeType);

		type _CheckInput = ExpectType<
			DP.InputChecker<typeof checker>,
			FileInterface,
			"strict"
		>;

		expect(checker.isAsynchronous()).toBe(false);
		expect(checker.definition.mimeType).toBe(mimeType);
	});

	it("accepts a matching mime type", () => {
		const file = DServerFile.createFileInterface("/tmp/demo.txt");
		const parser = DServerDataParser.file({
			checkers: [DServerDataParser.checkerFileMimeType(/^text\/plain$/)],
		});

		expect(parser.parse(file)).toStrictEqual(E.success(file));
	});

	it("rejects a non-matching mime type", () => {
		const file = DServerFile.createFileInterface("/tmp/demo.json");
		const result = DServerDataParser.file({
			checkers: [DServerDataParser.checkerFileMimeType(/^text\/plain$/)],
		}).parse(file);

		expect(E.isLeft(result)).toBe(true);
		if (E.isLeft(result)) {
			expect(unwrap(result).issues[0]?.expected).toBe(
				"file with mime type matching ^text\\/plain$",
			);
		}
	});

	it("tests an empty mime type when none can be inferred", () => {
		const file = DServerFile.createFileInterface("/tmp/no-extension");
		const result = DServerDataParser.file({
			checkers: [DServerDataParser.checkerFileMimeType(/^text\/plain$/)],
		}).parse(file);

		expect(E.isLeft(result)).toBe(true);
	});

	it("works in pipe", () => {
		const mimeType = /^application\/json$/;
		const checker = pipe(
			mimeType,
			DServerDataParser.checkerFileMimeType,
		);

		expect(checker.definition.mimeType).toBe(mimeType);
	});
});
