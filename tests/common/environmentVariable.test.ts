import { type ExpectType, DP, E, pipe, unwrap } from "@duplojs/utils";
import { setEnvironment } from "@scripts";
import { environmentVariable } from "@scripts/common";
import { setDenoMock } from "tests/_utils/deno.mock";
import { setFsPromisesMock } from "tests/_utils/fsPromises.mock";

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
				APP_NAME: DP.string(),
			},
			{
				includedFiles: ["/tmp/app.env"],
				override: false,
				justRead: false,
			},
		);

		expect(E.isRight(result)).toBe(true);
		if (E.isRight(result)) {
			const env = unwrap(result);

			type _CheckOut = ExpectType<
				typeof env,
				{
					APP_NAME: string;
				},
				"strict"
			>;

			expect(env.APP_NAME).toBe("duplo");
		}
		expect(process.env.APP_NAME).toBe("duplo");
	});

	it("uses includedFiles instead of deprecated paths when both are defined", async() => {
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
				APP_NAME: DP.string(),
			},
			{
				includedFiles: ["/tmp/included.env"],
				paths: ["/tmp/deprecated.env"],
				override: false,
				justRead: true,
			},
		);

		expect(E.isRight(result)).toBe(true);
		if (E.isRight(result)) {
			expect(unwrap(result).APP_NAME).toBe("included");
		}
	});

	it("uses default params in NODE when params are omitted", async() => {
		setEnvironment("NODE");
		process.env = {
			APP_NAME: "base",
		};

		const result = await environmentVariable(
			{
				APP_NAME: DP.string(),
			},
		);

		expect(E.isRight(result)).toBe(true);
		if (E.isRight(result)) {
			expect(unwrap(result).APP_NAME).toBe("base");
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
				APP_NAME: DP.string(),
			},
			{
				includedFiles: ["/tmp/app.env"],
				override: false,
				justRead: true,
			},
		);

		expect(E.isRight(result)).toBe(true);
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
				APP_NAME: DP.string(),
			},
			{
				includedFiles: ["/tmp/app.env"],
				override: false,
				justRead: false,
			},
		);

		expect(E.isRight(result)).toBe(true);
		if (E.isRight(result)) {
			expect(unwrap(result).APP_NAME).toBe("base");
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
				APP_NAME: DP.string(),
			},
			{
				includedFiles: ["/tmp/app.env"],
				override: true,
				justRead: false,
			},
		);

		expect(E.isRight(result)).toBe(true);
		if (E.isRight(result)) {
			expect(unwrap(result).APP_NAME).toBe("file");
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
				APP_NAME: DP.string(),
			},
			{
				includedFiles: ["/tmp/missing.env"],
				override: false,
				justRead: false,
			},
		);

		expect(E.isLeft(result)).toBe(true);
	});

	it("returns a left when parsed env does not match NODE schema", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			readFile: vi.fn().mockResolvedValue("APP_NAME=duplo"),
		});

		const result = await environmentVariable(
			{
				PORT: DP.number(),
			},
			{
				includedFiles: ["/tmp/app.env"],
				override: false,
				justRead: false,
			},
		);

		expect(E.isLeft(result)).toBe(true);
	});

	it("decodes escaped line breaks from double quoted NODE values", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			readFile: vi.fn().mockResolvedValue("MESSAGE=\"line1\\nline2\\r\""),
		});

		const result = await environmentVariable(
			{
				MESSAGE: DP.string(),
			},
			{
				includedFiles: ["/tmp/app.env"],
				override: false,
				justRead: true,
			},
		);

		expect(E.isRight(result)).toBe(true);
		if (E.isRight(result)) {
			expect(unwrap(result).MESSAGE).toBe("line1\nline2\r");
		}
	});

	it("resolves missing and circular NODE variables to empty strings", async() => {
		setEnvironment("NODE");
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
				MISSING: DP.string(),
				SELF: DP.string(),
				FIRST: DP.string(),
				SECOND: DP.string(),
			},
			{
				includedFiles: ["/tmp/app.env"],
				override: true,
				justRead: true,
			},
		);

		expect(E.isRight(result)).toBe(true);
		if (E.isRight(result)) {
			const env = unwrap(result);
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
			},
			readTextFile: vi.fn().mockResolvedValue([
				"APP_NAME=duplo",
				"COMPOSED=\"${BASE}/api\"",
				"EMPTY=",
			].join("\n")),
		});

		const result = await environmentVariable(
			{
				BASE: DP.string(),
				APP_NAME: DP.string(),
				COMPOSED: DP.string(),
			},
			{
				includedFiles: ["/tmp/deno.env"],
				override: false,
				justRead: false,
			},
		);

		expect(E.isRight(result)).toBe(true);
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
				APP_NAME: DP.string(),
			},
		);

		expect(E.isRight(result)).toBe(true);
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
			},
		});

		const result = await environmentVariable(
			{
				EMPTY: DP.string(),
				APP_NAME: DP.string(),
			},
		);

		expect(E.isRight(result)).toBe(true);
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
				BASE: DP.string(),
				APP_NAME: DP.string(),
			},
			{
				includedFiles: ["/tmp/deno.env"],
				override: false,
				justRead: true,
			},
		);

		expect(E.isRight(result)).toBe(true);
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
				APP_NAME: DP.string(),
			},
			{
				includedFiles: ["/tmp/deno.env"],
				override: false,
				justRead: false,
			},
		);

		expect(E.isLeft(result)).toBe(true);
	});

	it("returns a left when parsed env does not match DENO schema", async() => {
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
				PORT: DP.number(),
			},
			{
				includedFiles: ["/tmp/deno.env"],
				override: false,
				justRead: false,
			},
		);

		expect(E.isLeft(result)).toBe(true);
	});

	it("works when called from pipe", async() => {
		setEnvironment("NODE");
		process.env = {};
		setFsPromisesMock({
			readFile: vi.fn().mockResolvedValue("APP_NAME=duplo"),
		});

		const result = await pipe(
			{
				APP_NAME: DP.string(),
			},
			(shape) => environmentVariable(
				shape,
				{
					includedFiles: ["/tmp/app.env"],
					override: false,
					justRead: true,
				},
			),
		);

		expect(E.isRight(result)).toBe(true);
	});
});
