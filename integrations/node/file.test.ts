import { rm } from "node:fs/promises";
import * as DCommon from "@duplojs/lang/common";
import * as DEither from "@duplojs/lang/either";
import { DServerFile } from "@duplojs/server";

const rootPath = `${process.cwd()}/integrations/.tmp-file-node`;
const fixturesPath = `${process.cwd()}/integrations/fixtures/file` as never;

const paths = {
	workspace: `${rootPath}/workspace`,
	text: `${rootPath}/workspace/message.txt`,
	bytes: `${rootPath}/workspace/bytes.bin`,
	json: `${rootPath}/workspace/config.json`,
	copy: `${rootPath}/copy`,
	move: `${rootPath}/moved.txt`,
};

describe("file feature on node", () => {
	beforeEach(async() => {
		await rm(rootPath, {
			force: true,
			recursive: true,
		});

		const result = await DServerFile.ensureDirectory(paths.workspace as never);

		expect(DEither.isRight(result)).toBe(true);
		expect(DEither.unwrapRight(result)).toBeUndefined();
	});

	afterEach(async() => {
		await rm(rootPath, {
			force: true,
			recursive: true,
		});
	});

	it("writes, appends, reads and stats a text file", async() => {
		const writeResult = await DServerFile.writeTextFile(paths.text as never, "hello");
		expect(DEither.isRight(writeResult)).toBe(true);
		expect(DEither.unwrapRight(writeResult)).toBeUndefined();

		const appendResult = await DServerFile.appendTextFile(paths.text as never, " node");
		expect(DEither.isRight(appendResult)).toBe(true);
		expect(DEither.unwrapRight(appendResult)).toBeUndefined();

		const readResult = await DServerFile.readTextFile(paths.text as never);
		DCommon.asserts(readResult, DEither.isRight);
		expect(DEither.unwrapRight(readResult)).toBe("hello node");

		const existsResult = await DServerFile.exists(paths.text as never);
		expect(DEither.isRight(existsResult)).toBe(true);
		expect(DEither.unwrapRight(existsResult)).toBeUndefined();

		const statResult = await DServerFile.stat(paths.text as never);
		DCommon.asserts(statResult, DEither.isRight);

		const stat = DEither.unwrapRight(statResult);
		expect(stat.isFile).toBe(true);
		expect(stat.sizeBytes).toBe("hello node".length);
	});

	it("writes, appends and reads binary content", async() => {
		const writeResult = await DServerFile.writeFile(paths.bytes as never, new Uint8Array([1, 2]));
		expect(DEither.isRight(writeResult)).toBe(true);
		expect(DEither.unwrapRight(writeResult)).toBeUndefined();

		const appendResult = await DServerFile.appendFile(paths.bytes as never, new Uint8Array([3]));
		expect(DEither.isRight(appendResult)).toBe(true);
		expect(DEither.unwrapRight(appendResult)).toBeUndefined();

		const readResult = await DServerFile.readFile(paths.bytes as never);
		DCommon.asserts(readResult, DEither.isRight);
		expect([...DEither.unwrapRight(readResult)]).toEqual([1, 2, 3]);
	});

	it("writes and reads JSON content", async() => {
		const writeResult = await DServerFile.writeJsonFile(
			paths.json as never,
			{
				runtime: "node",
				ok: true,
			},
			{ space: 2 },
		);
		expect(DEither.isRight(writeResult)).toBe(true);
		expect(DEither.unwrapRight(writeResult)).toBeUndefined();

		const readResult = await DServerFile.readJsonFile(paths.json as never);
		DCommon.asserts(readResult, DEither.isRight);
		expect(DEither.unwrapRight(readResult)).toEqual({
			runtime: "node",
			ok: true,
		});
	});

	it("copies, moves, renames and truncates a file", async() => {
		const copyResult = await DServerFile.copy(fixturesPath, paths.copy as never);
		expect(DEither.isRight(copyResult)).toBe(true);
		expect(DEither.unwrapRight(copyResult)).toBeUndefined();

		const readCopyResult = await DServerFile.readTextFile(`${paths.copy}/source.txt` as never);
		DCommon.asserts(readCopyResult, DEither.isRight);
		expect(DEither.unwrapRight(readCopyResult)).toBe("Hello from fixture.\n");

		const moveResult = await DServerFile.move(`${paths.copy}/source.txt` as never, paths.move as never);
		expect(DEither.isRight(moveResult)).toBe(true);
		expect(DEither.unwrapRight(moveResult)).toBeUndefined();

		const renamedResult = await DServerFile.rename(paths.move as never, DCommon.infer("renamed.txt"));
		DCommon.asserts(renamedResult, DEither.isRight);

		const renamedPath = DEither.unwrapRight(renamedResult);
		const readRenamedResult = await DServerFile.readTextFile(renamedPath);
		DCommon.asserts(readRenamedResult, DEither.isRight);
		expect(DEither.unwrapRight(readRenamedResult)).toBe("Hello from fixture.\n");

		const truncateResult = await DServerFile.truncate(renamedPath, 5);
		expect(DEither.isRight(truncateResult)).toBe(true);
		expect(DEither.unwrapRight(truncateResult)).toBeUndefined();

		const readTruncateResult = await DServerFile.readTextFile(renamedPath);
		DCommon.asserts(readTruncateResult, DEither.isRight);
		expect(DEither.unwrapRight(readTruncateResult)).toBe("Hello");
	});
});
