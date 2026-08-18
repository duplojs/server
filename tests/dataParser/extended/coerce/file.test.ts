import { type DP, E, type ExpectType, pipe, unwrap } from "@duplojs/utils";
import { DServerDataParser, DServerFile, TESTImplementation, setEnvironment } from "@scripts";
import * as DServerFileSource from "@scripts/file";
import type { FileInterface } from "@scripts/file";

describe("dataParser.extended.coerce.file", () => {
	afterEach(() => {
		TESTImplementation.clear();
		vi.restoreAllMocks();
	});

	it("creates an extended coercing file parser with expected types", () => {
		const parser = DServerDataParser.extended.coerce.file();

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

		expect(parser.definition.coerce).toBe(true);
		expect(parser.isAsynchronous()).toBe(false);
	});

	it("coerces a string path and keeps extended helpers", async() => {
		setEnvironment("TEST");
		TESTImplementation.set("stat", vi.fn().mockResolvedValue(E.success({
			isFile: true,
		} as never)));
		const file = DServerFile.createFileInterface("/tmp/demo.txt");
		vi.spyOn(DServerFileSource, "createFileInterface").mockReturnValue(file);
		const parser = DServerDataParser.extended.coerce.file().exist();

		const result = await parser.asyncParse("/tmp/demo.txt");

		expect(E.isRight(result)).toBe(true);
		expect(unwrap(result)).toBe(file);
	});

	it("works in pipe and chains extended file helpers", async() => {
		setEnvironment("TEST");
		TESTImplementation.set("stat", vi.fn().mockResolvedValue(E.success({
			isFile: true,
			sizeBytes: 5,
		} as never)));
		const parser = pipe(
			{ errorMessage: "invalid-file" },
			DServerDataParser.extended.coerce.file,
		)
			.mimeType(/^application\/json$/)
			.size({ max: 10 });
		const file = DServerFile.createFileInterface("/tmp/demo.json");
		vi.spyOn(DServerFileSource, "createFileInterface").mockReturnValue(file);

		const result = await parser.asyncParse("/tmp/demo.json");

		expect(E.isRight(result)).toBe(true);
		expect(unwrap(result)).toBe(file);
	});
});
