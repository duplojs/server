import { type DP, E, type ExpectType, pipe, unwrap } from "@duplojs/utils";
import { DServerDataParser, DServerFile } from "@scripts";
import * as DServerFileSource from "@scripts/file";
import type { FileInterface } from "@scripts/file";

describe("dataParser.coerce.file", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("creates a file parser with coercion enabled and expected types", () => {
		const parser = DServerDataParser.coerce.file();

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

	it("coerces a string path to a file interface", () => {
		const file = DServerFile.createFileInterface("/tmp/demo.txt");
		const createFileInterfaceSpy = vi
			.spyOn(DServerFileSource, "createFileInterface")
			.mockReturnValue(file);

		const result = DServerDataParser.coerce.file().parse("/tmp/demo.txt");

		expect(createFileInterfaceSpy).toHaveBeenCalledWith("/tmp/demo.txt");
		expect(E.isRight(result)).toBe(true);
		expect(unwrap(result)).toBe(file);
	});

	it("accepts an existing file interface without coercing it", () => {
		const file = DServerFile.createFileInterface("/tmp/demo.txt");
		const createFileInterfaceSpy = vi.spyOn(DServerFileSource, "createFileInterface");

		const result = DServerDataParser.coerce.file().parse(file);

		expect(createFileInterfaceSpy).not.toHaveBeenCalled();
		expect(result).toStrictEqual(E.success(file));
	});

	it("rejects non-string values that are not file interfaces", () => {
		const result = DServerDataParser.coerce.file().parse({
			path: "/tmp/demo.txt",
		});

		expect(E.isLeft(result)).toBe(true);
	});

	it("works in pipe and keeps the provided definition", () => {
		const parser = pipe(
			{ errorMessage: "invalid-file" },
			DServerDataParser.coerce.file,
		);

		expect(parser.definition.coerce).toBe(true);
		expect(parser.definition.errorMessage).toBe("invalid-file");
	});
});
