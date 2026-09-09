import * as DEither from "@duplojs/lang/either";
import * as DDataStructure from "@duplojs/lang/dataStructure";
import * as DChrono from "@duplojs/lang/chrono";
import * as DCommon from "@duplojs/lang/common";
import type * as DPath from "@duplojs/lang/path";
import { DServerDataStructure, DServerFile } from "@scripts";

function createStatInfo(params?: Partial<DServerFile.StatInfo>): DServerFile.StatInfo {
	const now = DChrono.createDateOrThrow(new Date("2020-01-01T00:00:00Z"));

	return {
		isFile: true,
		isDirectory: false,
		isSymlink: false,
		sizeBytes: 1024,
		modifiedAt: now,
		accessedAt: now,
		createdAt: now,
		changedAt: now,
		deviceId: 1,
		inode: 2,
		permissionsMode: 0o644,
		hardLinkCount: 1,
		ownerUserId: 1000,
		ownerGroupId: 1000,
		specialDeviceId: null,
		ioBlockSize: null,
		allocatedBlockCount: null,
		isBlockDevice: false,
		isCharacterDevice: false,
		isFifo: false,
		isSocket: false,
		...params,
	};
}

describe("dataStructure file", () => {
	it("creates a file structure that decodes strings into file interfaces", async() => {
		const structure = DServerDataStructure.file();

		const result = await structure.asyncUnsafeDecode(
			DServerDataStructure.codecsString,
			"/tmp/avatar.png",
		);

		type _CheckStructure = DCommon.ExpectType<
			DDataStructure.StructureValue<typeof structure>,
			DServerFile.FileInterface,
			"strict"
		>;

		expect(DEither.isRight(result)).toBe(true);
		if (DEither.isRight(result)) {
			const file = DEither.unwrapRight(result);

			expect(file.path).toBe("/tmp/avatar.png");
			expect(file.getMimeType()).toBe("image/png");
		}
	});

	it("rejects values that are not valid encoded file paths", async() => {
		const structure = DServerDataStructure.file();

		const result = await structure.asyncUnsafeDecode(
			DServerDataStructure.codecsString,
			42,
		);

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("encodes file interfaces with string and json codecs", async() => {
		const structure = DServerDataStructure.file();
		const file = DServerFile.createFileInterface(DCommon.infer("/tmp/config.json"));

		const stringResult = await structure.asyncEncode(
			DServerDataStructure.codecsString,
			file,
		);
		const jsonResult = await structure.asyncEncode(
			DServerDataStructure.codecsJson,
			file,
		);

		type _CheckStringResult = DCommon.ExpectType<
			typeof stringResult,
			| DEither.Right<"encode-success", string & DPath.Path>
			| DEither.Left<"encode-error", DDataStructure.Error>,
			"strict"
		>;

		expect(DEither.isRight(stringResult)).toBe(true);
		expect(DEither.isRight(jsonResult)).toBe(true);
		if (DEither.isRight(stringResult) && DEither.isRight(jsonResult)) {
			expect(DEither.unwrapRight(stringResult)).toBe("/tmp/config.json");
			expect(DEither.unwrapRight(jsonResult)).toBe("/tmp/config.json");
		}
	});

	it("decodes file interfaces with json codecs", async() => {
		const structure = DServerDataStructure.file();

		const result = await structure.asyncDecode(
			DServerDataStructure.codecsJson,
			DCommon.infer("/tmp/config.json"),
		);

		expect(DEither.isRight(result)).toBe(true);
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result).path).toBe("/tmp/config.json");
		}
	});

	it("checks file interfaces through the server fundamental type and file type", async() => {
		const structure = DServerDataStructure.file();
		const file = DServerFile.createFileInterface(DCommon.infer("/tmp/avatar.png"));
		const fileType = DServerDataStructure.FileType();

		const success = await structure.asyncCheck(file);
		const failure = await structure.asyncCheck({ path: "/tmp/avatar.png" });

		expect(DEither.isRight(success)).toBe(true);
		expect(DEither.isLeft(failure)).toBe(true);
		expect(fileType.executeCheck(file)).toBe(DDataStructure.SuccessSymbol);
		expect(fileType.isAsynchronous()).toBe(false);
	});

	it("checks server file constraints without retesting lang structure composition", async() => {
		const file = DServerFile.createFileInterface(DCommon.infer("/tmp/avatar.png"));
		const stat = vi.fn().mockResolvedValue(DEither.success(createStatInfo()));
		file.stat = stat;

		const success = await DServerDataStructure.file([
			DServerDataStructure.exist(),
			DServerDataStructure.size({
				min: "1kb",
				max: "2kb",
			}),
			DServerDataStructure.mimeType(/^text\//),
		]).asyncCheck(file);

		expect(DEither.isRight(success)).toBe(true);
		expect(stat).toHaveBeenCalledTimes(2);
		expect(DServerDataStructure.exist().isAsynchronous()).toBe(true);
		expect(DServerDataStructure.size({}).isAsynchronous()).toBe(true);
		expect(DServerDataStructure.mimeType("text/plain").isAsynchronous()).toBe(false);
	});

	it("rejects when server file constraints fail", async() => {
		const missing = DServerFile.createFileInterface(DCommon.infer("/tmp/avatar.png"));
		missing.stat = vi.fn().mockResolvedValue(DEither.left("file-system-stat", new Error("missing")));

		const directory = DServerFile.createFileInterface(DCommon.infer("/tmp/avatar.png"));
		directory.stat = vi.fn().mockResolvedValue(DEither.success(createStatInfo({
			isFile: false,
			isDirectory: true,
		})));

		const tooSmall = DServerFile.createFileInterface(DCommon.infer("/tmp/avatar.png"));
		tooSmall.stat = vi.fn().mockResolvedValue(DEither.success(createStatInfo({
			sizeBytes: 10,
		})));

		const tooLarge = DServerFile.createFileInterface(DCommon.infer("/tmp/avatar.png"));
		tooLarge.stat = vi.fn().mockResolvedValue(DEither.success(createStatInfo({
			sizeBytes: 3000,
		})));

		const existStructure = DServerDataStructure.file([DServerDataStructure.exist()]);
		const directoryStructure = DServerDataStructure.file([DServerDataStructure.size({ min: 1 })]);
		const sizeStructure = DServerDataStructure.file([DServerDataStructure.size({ min: "1kb" })]);
		const maxSizeStructure = DServerDataStructure.file([DServerDataStructure.size({ max: "2kb" })]);
		const mimeTypeStructure = DServerDataStructure.file([DServerDataStructure.mimeType("image/png")]);
		const nullableMimeTypeStructure = DServerDataStructure.file([DServerDataStructure.mimeType("image/png")]);

		const existResult = await existStructure.asyncCheck(missing);
		const directoryExistResult = await existStructure.asyncCheck(directory);
		const directoryResult = await directoryStructure.asyncCheck(directory);
		const sizeResult = await sizeStructure.asyncCheck(tooSmall);
		const maxSizeResult = await maxSizeStructure.asyncCheck(tooLarge);
		const mimeTypeResult = await mimeTypeStructure.asyncCheck(
			DServerFile.createFileInterface(DCommon.infer("/tmp/avatar.png")),
		);
		const nullableMimeTypeResult = await nullableMimeTypeStructure.asyncCheck(
			DServerFile.createFileInterface(DCommon.infer("/tmp/README")),
		);

		expect(DEither.isLeft(existResult)).toBe(true);
		expect(DEither.isLeft(directoryExistResult)).toBe(true);
		expect(DEither.isLeft(directoryResult)).toBe(true);
		expect(DEither.isLeft(sizeResult)).toBe(true);
		expect(DEither.isLeft(maxSizeResult)).toBe(true);
		expect(DEither.isLeft(mimeTypeResult)).toBe(true);
		expect(DEither.isRight(nullableMimeTypeResult)).toBe(true);
	});
});
