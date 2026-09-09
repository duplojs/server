import * as DDataStructure from "@duplojs/lang/dataStructure";
import { codecsJson } from "../codec";

export const defaultErrorInterpreterDataStructureDictionary = {
	...DDataStructure.defaultErrorInterpreterDataStructureDictionary,
	"@DuplojsServerDataStructure/file-type": () => "Expected a valid file.",
	"@DuplojsServerDataStructure/size-constraint": (source) => {
		const { min, max } = source.definition;

		if (min !== undefined && max !== undefined) {
			return `Expected a file size between ${min} and ${max} bytes.`;
		}

		if (min !== undefined) {
			return `Expected a file size of at least ${min} bytes.`;
		}

		if (max !== undefined) {
			return `Expected a file size of at most ${max} bytes.`;
		}

		return "Expected a valid file size.";
	},
	"@DuplojsServerDataStructure/mime-type-constraint": (source) => `Expected a file with a MIME type matching ${source.definition.regex.toString()}.`,
	"@DuplojsServerDataStructure/exist-constraint": () => "Expected the file to exist.",
} as const satisfies Required<DDataStructure.StructureDictionaryParams>;

export const defaultErrorInterpreterCodecDictionary = [
	...DDataStructure.defaultErrorInterpreterCodecDictionary,
	[
		codecsJson.definition.file,
		(_codec, issue) => {
			if (issue.from === "predicate") {
				return DDataStructure.encodeIssueKind.has(issue)
					? "The JSON file codec must produce a valid file path string."
					: "Expected a valid file path string for the JSON file codec.";
			}

			if (issue.from === "encoding") {
				return "The JSON file codec could not encode the file.";
			}

			if (issue.from === "decoding") {
				return "The JSON file codec could not decode the value as a file.";
			}

			return `The JSON file codec encountered an external error while ${DDataStructure.encodeIssueKind.has(issue) ? "encoding" : "decoding"}.`;
		},
	],
] as const satisfies DDataStructure.CodecDictionaryParams;
