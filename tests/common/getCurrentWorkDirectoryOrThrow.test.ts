import { GetCurrentWorkDirectoryError, getCurrentWorkDirectoryOrThrow, setEnvironment } from "@scripts";
import { setDenoMock } from "@tests/_utils/deno.mock";
import { setProcessMock } from "@tests/_utils/process.mock";

describe("getCurrentWorkDirectoryOrThrow", () => {
	afterEach(() => {
		setEnvironment("NODE");
		vi.clearAllMocks();
	});

	it("returns current working directory in NODE env", () => {
		setEnvironment("NODE");
		setProcessMock({
			cwd: () => "/node",
		});

		const result = getCurrentWorkDirectoryOrThrow();

		expect(result).toBe("/node");
	});

	it("returns current working directory in DENO env", () => {
		setEnvironment("DENO");
		setDenoMock({
			cwd: () => "/deno",
		});

		const result = getCurrentWorkDirectoryOrThrow();

		expect(result).toBe("/deno");
	});

	it("throws when current directory cannot be read", () => {
		setEnvironment("NODE");
		setProcessMock({
			cwd: () => {
				throw new Error("boom");
			},
		});

		expect(() => getCurrentWorkDirectoryOrThrow())
			.toThrow(GetCurrentWorkDirectoryError);
	});
});
