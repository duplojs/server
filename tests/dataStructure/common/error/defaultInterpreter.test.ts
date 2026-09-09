import * as DDataStructure from "@duplojs/lang/dataStructure";
import { DServerDataStructure } from "@scripts";

describe("defaultInterpreter", () => {
	it("interprets server file data structure issues", () => {
		const dataStructureDictionary = DServerDataStructure.defaultErrorInterpreterDataStructureDictionary;

		expect(dataStructureDictionary["@DuplojsServerDataStructure/file-type"]()).toBe("Expected a valid file.");
		expect(dataStructureDictionary["@DuplojsServerDataStructure/exist-constraint"]()).toBe("Expected the file to exist.");
		expect(dataStructureDictionary["@DuplojsServerDataStructure/mime-type-constraint"]({
			definition: {
				regex: /^image\//,
			},
		} as never)).toBe("Expected a file with a MIME type matching /^image\\//.");
	});

	it("interprets server file size constraints", () => {
		const sizeInterpreter = DServerDataStructure.defaultErrorInterpreterDataStructureDictionary["@DuplojsServerDataStructure/size-constraint"];

		expect(sizeInterpreter({
			definition: {
				min: 10,
				max: 20,
			},
		} as never)).toBe("Expected a file size between 10 and 20 bytes.");
		expect(sizeInterpreter({
			definition: {
				min: 10,
				max: undefined,
			},
		} as never)).toBe("Expected a file size of at least 10 bytes.");
		expect(sizeInterpreter({
			definition: {
				min: undefined,
				max: 20,
			},
		} as never)).toBe("Expected a file size of at most 20 bytes.");
		expect(sizeInterpreter({
			definition: {
				min: undefined,
				max: undefined,
			},
		} as never)).toBe("Expected a valid file size.");
	});

	it("interprets server file json codec issues", () => {
		const codecInterpreter = DServerDataStructure.defaultErrorInterpreterCodecDictionary.find(
			([codec]) => codec === DServerDataStructure.codecsJson.definition.file,
		)?.[1];

		if (!codecInterpreter) {
			throw new Error("Expected server file json codec interpreter.");
		}

		expect(codecInterpreter({} as never, {
			from: "predicate",
			[DDataStructure.encodeIssueKind.runTimeKey]: null,
		} as never)).toBe("The JSON file codec must produce a valid file path string.");
		expect(codecInterpreter({} as never, {
			from: "predicate",
		} as never)).toBe("Expected a valid file path string for the JSON file codec.");
		expect(codecInterpreter({} as never, {
			from: "encoding",
		} as never)).toBe("The JSON file codec could not encode the file.");
		expect(codecInterpreter({} as never, {
			from: "decoding",
		} as never)).toBe("The JSON file codec could not decode the value as a file.");
		expect(codecInterpreter({} as never, {
			from: "external",
			[DDataStructure.encodeIssueKind.runTimeKey]: null,
		} as never)).toBe("The JSON file codec encountered an external error while encoding.");
		expect(codecInterpreter({} as never, {
			from: "external",
		} as never)).toBe("The JSON file codec encountered an external error while decoding.");
	});
});
