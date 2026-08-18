import { DP, E } from "@duplojs/utils";
import { DServerCommand, DServerDataParser, TESTImplementation, setEnvironment } from "@scripts";
import { SymbolCommandError, createError } from "@scripts/command/error";

describe("argument", () => {
	afterEach(() => {
		setEnvironment("NODE");
		TESTImplementation.clear();
	});

	it("returns command error when required argument is missing", async() => {
		const argument = DServerCommand.createArgument("id", DP.number());
		const error = createError("root");

		await expect(argument.execute(undefined, error)).resolves.toBe(SymbolCommandError);
		expect(error.issues[0]).toMatchObject({
			type: "argument",
			target: "id",
		});
	});

	it("returns undefined when optional argument is missing", async() => {
		const argument = DServerCommand.createArgument("id", DP.number(), { optional: true });
		const error = createError("root");

		await expect(argument.execute(undefined, error)).resolves.toBeUndefined();
		expect(error.issues).toEqual([]);
	});

	it("uses asynchronous parser branch", async() => {
		setEnvironment("TEST");
		TESTImplementation.set(
			"stat",
			vi.fn().mockResolvedValue(E.success({
				isFile: true,
				sizeBytes: 1,
			} as never)),
		);

		const argument = DServerCommand.createArgument(
			"file",
			DServerDataParser.file({
				checkers: [DServerDataParser.checkerFileExist()],
			}),
		);
		const error = createError("root");

		await expect(argument.execute("/tmp/demo.txt", error)).resolves.toMatchObject({
			path: "/tmp/demo.txt",
		});
		expect(error.issues).toEqual([]);
	});
});
