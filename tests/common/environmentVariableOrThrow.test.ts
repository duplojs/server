import * as DDataStructure from "@duplojs/lang/dataStructure";
import * as DCommon from "@duplojs/lang/common";
import { setEnvironment } from "@scripts";
import { EnvironmentVariableError, environmentVariableOrThrow } from "@scripts/common";
import { setFsPromisesMock } from "@tests/_utils/fsPromises.mock";

describe("environmentVariableOrThrow", () => {
	const initialProcessEnv = process.env;

	afterEach(() => {
		setEnvironment("NODE");
		vi.clearAllMocks();
		process.env = { ...initialProcessEnv };
	});

	it("returns parsed env when reading and structure validation succeed", async() => {
		setEnvironment("NODE");
		process.env = {};
		setFsPromisesMock({
			readFile: vi.fn().mockResolvedValue("APP_NAME=duplo"),
		});

		const result = await environmentVariableOrThrow(
			{
				APP_NAME: DDataStructure.string(),
			},
			{
				includedEnvironmentFiles: [DCommon.infer("/tmp/app.env")],
				override: false,
				justRead: true,
			},
		);

		type _CheckOut = DCommon.ExpectType<
			typeof result,
			{
				readonly APP_NAME: string;
			},
			"strict"
		>;

		expect(result).toEqual({
			APP_NAME: "duplo",
		});
	});

	it("throws EnvironmentVariableError when env file reading fails", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			readFile: vi.fn().mockRejectedValue(new Error("boom")),
		});

		await expect(
			environmentVariableOrThrow(
				{
					APP_NAME: DDataStructure.string(),
				},
				{
					includedEnvironmentFiles: [DCommon.infer("/tmp/missing.env")],
					override: false,
					justRead: false,
				},
			),
		).rejects.toBeInstanceOf(EnvironmentVariableError);
	});

	it("throws EnvironmentVariableError when structure validation fails", async() => {
		setEnvironment("NODE");
		setFsPromisesMock({
			readFile: vi.fn().mockResolvedValue("APP_NAME=duplo"),
		});

		await expect(
			environmentVariableOrThrow(
				{
					PORT: DDataStructure.number(),
				},
				{
					includedEnvironmentFiles: [DCommon.infer("/tmp/app.env")],
					override: false,
					justRead: false,
				},
			),
		).rejects.toBeInstanceOf(EnvironmentVariableError);
	});
});
