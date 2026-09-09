import * as DCommon from "@duplojs/lang/common";
import { DServerDataStructure, DServerFile } from "@scripts";

describe("file default codecs", () => {
	it("encodes and decodes files with the string codec", () => {
		const fileCodec = DServerDataStructure.codecsString.definition.file;
		const file = DServerFile.createFileInterface(DCommon.infer("/tmp/avatar.png"));

		expect(fileCodec.predicateEncode("/tmp/avatar.png")).toBe(true);
		expect(fileCodec.predicateEncode(42)).toBe(false);
		expect(fileCodec.encode(file)).toBe("/tmp/avatar.png");
		expect(fileCodec.decode(DCommon.infer("/tmp/avatar.png"))).toMatchObject({
			path: "/tmp/avatar.png",
		});
	});

	it("encodes and decodes files with the json codec", () => {
		const fileCodec = DServerDataStructure.codecsJson.definition.file;
		const file = DServerFile.createFileInterface(DCommon.infer("/tmp/config.json"));

		expect(fileCodec.predicateEncode("/tmp/config.json")).toBe(true);
		expect(fileCodec.predicateEncode(42)).toBe(false);
		expect(fileCodec.encode(file)).toBe("/tmp/config.json");
		expect(fileCodec.decode(DCommon.infer("/tmp/config.json"))).toMatchObject({
			path: "/tmp/config.json",
		});
	});
});
