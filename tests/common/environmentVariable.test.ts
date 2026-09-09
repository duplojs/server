import * as DEither from "@duplojs/lang/either";
import * as DDataStructure from "@duplojs/lang/dataStructure";
import * as DCommon from "@duplojs/lang/common";
import { DServerDataStructure, type DServerFile, environmentVariable, setEnvironment } from "@scripts";
import { setDenoMock } from "@tests/_utils/deno.mock";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";

describe("environmentVariable", () => {
	const initialProcessEnv = process.env;

	afterEach(() => {
		setEnvironment("NODE");
		vi.clearAllMocks();
		vi.restoreAllMocks();
		process.env = { ...initialProcessEnv };
	});

	it("reads a NODE env file and sets process.env by default", async() => {
		setEnvironment("NODE");
		process.env = {};
		setFsPromisesMock({
			readFile: vi.fn().mockResolvedValue("APP_NAME=duplo"),
		});

		const result = await environmentVariable(
			{
				APP_NAME: DDataStructure.string(),
			},
			{
				includedEnvironmentFiles: [DCommon.infer("/tmp/app.env")],
				override: false,
				justRead: false,
			},
		);

		expect(DEither.isRight(result)).toBe(true);
		if (DEither.isRight(result)) {
			const env = DEither.unwrapRight(result);

			type _CheckOut = DCommon.ExpectType<
				typeof env,
				{
					readonly APP_NAME: string;
				},
				"strict"
			>;

			expect(env.APP_NAME).toBe("duplo");
		}
		expect(process.env.APP_NAME).toBe("duplo");
	});

	it("decodes NODE file variables with server codecs by default", async() => {
		setEnvironment("NODE");
		process.env = {};
		setFsPromisesMock({
			readFile: vi.fn().mockResolvedValue("APP_FILE=/tmp/app.json"),
		});

		const result = await environmentVariable(
			{
				APP_FILE: DServerDataStructure.file(),
			},
			{
				includedEnvironmentFiles: [DCommon.infer("/tmp/app.env")],
				override: false,
				justRead: true,
			},
		);

		expect(DEither.isRight(result)).toBe(true);
		if (DEither.isRight(result)) {
			const env = DEither.unwrapRight(result);

			type _CheckOut = DCommon.ExpectType<
				typeof env,
				{
					readonly APP_FILE: DServerFile.FileInterface;
				},
				"strict"
			>;

			expect(env.APP_FILE.path).toBe("/tmp/app.json");
		}
	});

	it("uses includedEnvironmentFiles instead of deprecated paths when both are defined", async() => {
		setEnvironment("NODE");
		process.env = {};
		setFsPromisesMock({
			readFile: vi.fn((path: string) => Promise.resolve(
				path === "/tmp/included.env"
					? "APP_NAME=included"
					: "APP_NAME=deprecated",
			)),
		});

		const result = await environmentVariable(
			{
				APP_NAME: DDataStructure.string(),
			},
			{
				includedEnvironmentFiles: [DCommon.infer("/tmp/included.env")],
				override: false,
				justRead: true,
			},
		);

		expect(DEither.isRight(result)).toBe(true);
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result).APP_NAME).toBe("included");
		}
	});

	it("uses default params in NODE when params are omitted", async() => {
		setEnvironment("NODE");
		process.env = {
			APP_NAME: "base",
		};

		const result = await environmentVariable(
			{
				APP_NAME: DDataStructure.string(),
			},
		);

		expect(DEither.isRight(result)).toBe(true);
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result).APP_NAME).toBe("base");
		}
		expect(process.env.APP_NAME).toBe("base");
	});

	it("reads a NODE env file without mutating process.env when justRead is true", async() => {
		setEnvironment("NODE");
		process.env = {};
		setFsPromisesMock({
			readFile: vi.fn().mockResolvedValue("APP_NAME=duplo"),
		});

		const result = await environmentVariable(
			{
				APP_NAME: DDataStructure.string(),
			},
			{
				includedEnvironmentFiles: [DCommon.infer("/tmp/app.env")],
				override: false,
				justRead: true,
			},
		);

		expect(DEither.isRight(result)).toBe(true);
		expect(process.env.APP_NAME).toBeUndefined();
	});

	it("keeps base values when override is false in NODE env", async() => {
		setEnvironment("NODE");
		process.env = { APP_NAME: "base" };
		setFsPromisesMock({
			readFile: vi.fn().mockResolvedValue("APP_NAME=file"),
		});

		const result = await environmentVariable(
			{
				APP_NAME: DDataStructure.string(),
			},
			{
				includedEnvironmentFiles: [DCommon.infer("/tmp/app.env")],
				override: false,
				justRead: false,
			},
		);

		expect(DEither.isRight(result)).toBe(true);
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result).APP_NAME).toBe("base");
		}
		expect(process.env.APP_NAME).toBe("base");
	});

	it("overrides base values when override is true in NODE env", async() => {
		setEnvironment("NODE");
		process.env = { APP_NAME: "base" };
		setFsPromisesMock({
			readFile: vi.fn().mockResolvedValue("APP_NAME=file"),
		});

		const result = await environmentVariable(
			{
				APP_NAME: DDataStructure.string(),
			},
			{
				includedEnvironmentFiles: [DCommon.infer("/tmp/app.env")],
				override: true,
				justRead: false,
			},
		);

		expect(DEither.isRight(result)).toBe(true);
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result).APP_NAME).toBe("file");
		}
		expect(process.env.APP_NAME).toBe("file");
	});

	it("returns a left when NODE file reading fails", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			readFile: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await environmentVariable(
			{
				APP_NAME: DDataStructure.string(),
			},
			{
				includedEnvironmentFiles: [DCommon.infer("/tmp/missing.env")],
				override: false,
				justRead: false,
			},
		);

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("returns a left when parsed env does not match NODE structure", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			readFile: vi.fn().mockResolvedValue("APP_NAME=duplo"),
		});

		const result = await environmentVariable(
			{
				PORT: DDataStructure.number(),
			},
			{
				includedEnvironmentFiles: [DCommon.infer("/tmp/app.env")],
				override: false,
				justRead: false,
			},
		);

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("decodes escaped line breaks from double quoted NODE values", async() => {
		setEnvironment("NODE");
		process.env = {};
		setFsPromisesMock({
			readFile: vi.fn().mockResolvedValue("MESSAGE=\"line1\\nline2\\r\""),
		});

		const result = await environmentVariable(
			{
				MESSAGE: DDataStructure.string(),
			},
			{
				includedEnvironmentFiles: [DCommon.infer("/tmp/app.env")],
				override: false,
				justRead: true,
			},
		);

		expect(DEither.isRight(result)).toBe(true);
		if (DEither.isRight(result)) {
			expect(DEither.unwrapRight(result).MESSAGE).toBe("line1\nline2\r");
		}
	});

	it("resolves missing and circular NODE variables to empty strings", async() => {
		setEnvironment("NODE");
		process.env = {};
		setFsPromisesMock({
			readFile: vi.fn().mockResolvedValue([
				"MISSING=${NOT_DEFINED}",
				"SELF=${SELF}",
				"FIRST=${SECOND}",
				"SECOND=${FIRST}",
			].join("\n")),
		});

		const result = await environmentVariable(
			{
				MISSING: DDataStructure.string(),
				SELF: DDataStructure.string(),
				FIRST: DDataStructure.string(),
				SECOND: DDataStructure.string(),
			},
			{
				includedEnvironmentFiles: [DCommon.infer("/tmp/app.env")],
				override: true,
				justRead: true,
			},
		);

		expect(DEither.isRight(result)).toBe(true);
		if (DEither.isRight(result)) {
			const env = DEither.unwrapRight(result);
			expect(env.MISSING).toBe("");
			expect(env.SELF).toBe("");
			expect(env.FIRST).toBe("");
			expect(env.SECOND).toBe("");
		}
	});

	it("reads DENO env files and sets only truthy values", async() => {
		setEnvironment("DENO");
		const denoSetSpy = vi.fn();
		setDenoMock({
			env: {
				toObject: () => ({ BASE: "deno" }),
				set: denoSetSpy,
				delete: vi.fn(),
			},
			readTextFile: vi.fn().mockResolvedValue([
				"APP_NAME=duplo",
				"COMPOSED=\"${BASE}/api\"",
				"EMPTY=",
			].join("\n")),
		});

		const result = await environmentVariable(
			{
				BASE: DDataStructure.string(),
				APP_NAME: DDataStructure.string(),
				COMPOSED: DDataStructure.string(),
			},
			{
				includedEnvironmentFiles: [DCommon.infer("/tmp/deno.env")],
				override: false,
				justRead: false,
			},
		);

		expect(DEither.isRight(result)).toBe(true);
		expect(denoSetSpy).toHaveBeenCalledWith("BASE", "deno");
		expect(denoSetSpy).toHaveBeenCalledWith("APP_NAME", "duplo");
		expect(denoSetSpy).toHaveBeenCalledWith("COMPOSED", "deno/api");
		expect(denoSetSpy).not.toHaveBeenCalledWith("EMPTY", "");
	});

	it("uses default params in DENO when params are omitted", async() => {
		setEnvironment("DENO");
		const denoSetSpy = vi.fn();
		setDenoMock({
			env: {
				toObject: () => ({ APP_NAME: "deno" }),
				set: denoSetSpy,
			},
		});

		const result = await environmentVariable(
			{
				APP_NAME: DDataStructure.string(),
			},
		);

		expect(DEither.isRight(result)).toBe(true);
		expect(denoSetSpy).toHaveBeenCalledWith("APP_NAME", "deno");
	});

	it("skips empty values when writing DENO env from base env", async() => {
		setEnvironment("DENO");
		const denoSetSpy = vi.fn();
		setDenoMock({
			env: {
				toObject: () => ({
					EMPTY: "",
					APP_NAME: "deno",
				}),
				set: denoSetSpy,
				delete: vi.fn(),
			},
		});

		const result = await environmentVariable(
			{
				EMPTY: DDataStructure.string(),
				APP_NAME: DDataStructure.string(),
			},
		);

		expect(DEither.isRight(result)).toBe(true);
		expect(denoSetSpy).toHaveBeenCalledWith("APP_NAME", "deno");
		expect(denoSetSpy).not.toHaveBeenCalledWith("EMPTY", "");
	});

	it("does not write DENO env when justRead is true", async() => {
		setEnvironment("DENO");
		const denoSetSpy = vi.fn();
		setDenoMock({
			env: {
				toObject: () => ({ BASE: "deno" }),
				set: denoSetSpy,
			},
			readTextFile: vi.fn().mockResolvedValue("APP_NAME=duplo"),
		});

		const result = await environmentVariable(
			{
				BASE: DDataStructure.string(),
				APP_NAME: DDataStructure.string(),
			},
			{
				includedEnvironmentFiles: [DCommon.infer("/tmp/deno.env")],
				override: false,
				justRead: true,
			},
		);

		expect(DEither.isRight(result)).toBe(true);
		expect(denoSetSpy).not.toHaveBeenCalled();
	});

	it("returns a left when DENO file reading fails", async() => {
		setEnvironment("DENO");
		setDenoMock({
			env: {
				toObject: () => ({}),
				set: vi.fn(),
			},
			readTextFile: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const result = await environmentVariable(
			{
				APP_NAME: DDataStructure.string(),
			},
			{
				includedEnvironmentFiles: [DCommon.infer("/tmp/deno.env")],
				override: false,
				justRead: false,
			},
		);

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("returns a left when parsed env does not match DENO structure", async() => {
		setEnvironment("DENO");
		setDenoMock({
			env: {
				toObject: () => ({}),
				set: vi.fn(),
			},
			readTextFile: vi.fn().mockResolvedValue("APP_NAME=duplo"),
		});

		const result = await environmentVariable(
			{
				PORT: DDataStructure.number(),
			},
			{
				includedEnvironmentFiles: [DCommon.infer("/tmp/deno.env")],
				override: false,
				justRead: false,
			},
		);

		expect(DEither.isLeft(result)).toBe(true);
	});

	it("works when called from pipe", async() => {
		setEnvironment("NODE");
		process.env = {};
		setFsPromisesMock({
			readFile: vi.fn().mockResolvedValue("APP_NAME=duplo"),
		});

		const result = await DCommon.pipe(
			{
				APP_NAME: DDataStructure.string(),
			},
			(shape) => environmentVariable(
				shape,
				{
					includedEnvironmentFiles: [DCommon.infer("/tmp/app.env")],
					override: false,
					justRead: true,
				},
			),
		);

		expect(DEither.isRight(result)).toBe(true);
	});
});
