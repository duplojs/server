import * as DCommon from "@duplojs/lang/common";
import * as DDataStructure from "@duplojs/lang/dataStructure";
import * as DEither from "@duplojs/lang/either";
import { environmentVariable, getCurrentWorkDirectory, getProcessArguments, setCurrentWorkingDirectory } from "@duplojs/server";
import { assertEquals } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";

const initialWorkingDirectory = Deno.cwd();
const initialDenoEnv = Deno.env.toObject();
const rootPath = `${initialWorkingDirectory}/integrations/.tmp-common-deno`;
const applicationEnvPath = `${initialWorkingDirectory}/integrations/fixtures/env/application.env` as never;
const serviceEnvPath = `${initialWorkingDirectory}/integrations/fixtures/env/service.env` as never;
const runtimeEnvPath = `${initialWorkingDirectory}/integrations/fixtures/env/runtime.env` as never;

describe("common feature on deno", () => {
	beforeEach(async() => {
		Deno.chdir(initialWorkingDirectory);
		for (const key of Object.keys(Deno.env.toObject())) {
			Deno.env.delete(key);
		}
		Deno.env.set("APP_NAME", "process-app");
		Deno.env.set("TOKEN", "secret");
		await Deno.remove(rootPath, { recursive: true }).catch(() => undefined);
	});

	afterEach(async() => {
		Deno.chdir(initialWorkingDirectory);
		for (const key of Object.keys(Deno.env.toObject())) {
			Deno.env.delete(key);
		}
		for (const [key, value] of Object.entries(initialDenoEnv)) {
			Deno.env.set(key, value);
		}
		await Deno.remove(rootPath, { recursive: true }).catch(() => undefined);
	});

	it("reads environment files with override and expansion", async() => {
		const result = await environmentVariable(
			{
				APP_NAME: DDataStructure.string(),
				BASE_NAME: DDataStructure.string(),
				API_HOST: DDataStructure.string(),
				API_PREFIX: DDataStructure.string(),
				API_URL: DDataStructure.string(),
				FEATURE_FLAG: DDataStructure.boolean(),
				LOG_LABEL: DDataStructure.string(),
				MULTILINE: DDataStructure.string(),
				ESCAPED: DDataStructure.string(),
				COMPOSED: DDataStructure.string(),
				NEW_KEY: DDataStructure.string(),
				TOKEN: DDataStructure.string(),
			},
			{
				includedEnvironmentFiles: [applicationEnvPath, serviceEnvPath, runtimeEnvPath],
				override: true,
				justRead: true,
			},
		);

		DCommon.asserts(result, DEither.isRight);

		assertEquals(DEither.unwrapRight(result), {
			APP_NAME: "runtime-app",
			BASE_NAME: "service",
			API_HOST: "api.duplo.local",
			API_PREFIX: "/v2",
			API_URL: "https://api.duplo.local/v2",
			FEATURE_FLAG: true,
			LOG_LABEL: "[service]",
			MULTILINE: "line1\nline2\r",
			ESCAPED: "$TOKEN",
			COMPOSED: "service/v2",
			NEW_KEY: "runtime",
			TOKEN: "secret",
		});
		assertEquals(Deno.env.get("APP_NAME"), "process-app");
	});

	it("keeps Deno env values when override is disabled and mutates env by default", async() => {
		Deno.env.set("BASE_NAME", "process");
		Deno.env.set("API_HOST", "process.local");
		Deno.env.set("API_PREFIX", "/process");

		const result = await environmentVariable(
			{
				APP_NAME: DDataStructure.string(),
				BASE_NAME: DDataStructure.string(),
				API_HOST: DDataStructure.string(),
				API_PREFIX: DDataStructure.string(),
				API_URL: DDataStructure.string(),
				FEATURE_FLAG: DDataStructure.boolean(),
				LOG_LABEL: DDataStructure.string(),
				MULTILINE: DDataStructure.string(),
				ESCAPED: DDataStructure.string(),
				TOKEN: DDataStructure.string(),
			},
			{
				includedEnvironmentFiles: [applicationEnvPath, serviceEnvPath],
				override: false,
			},
		);

		DCommon.asserts(result, DEither.isRight);

		assertEquals(DEither.unwrapRight(result), {
			APP_NAME: "process-app",
			BASE_NAME: "process",
			API_HOST: "process.local",
			API_PREFIX: "/process",
			API_URL: "https://process.local/process",
			FEATURE_FLAG: true,
			LOG_LABEL: "[service]",
			MULTILINE: "line1\nline2\r",
			ESCAPED: "$TOKEN",
			TOKEN: "secret",
		});
		assertEquals(Deno.env.get("API_URL"), "https://process.local/process");
	});

	it("reads and changes the current working directory", async() => {
		await Deno.mkdir(rootPath, { recursive: true });

		const setResult = setCurrentWorkingDirectory(rootPath as never);
		assertEquals(DEither.isRight(setResult), true);
		assertEquals(DEither.unwrapRight(setResult), undefined);

		const getResult = getCurrentWorkDirectory();
		DCommon.asserts(getResult, DEither.isRight);
		assertEquals(DEither.unwrapRight(getResult), rootPath);
	});

	it("reads process arguments", () => {
		const result = getProcessArguments();

		assertEquals(result, Deno.args);
	});
});
