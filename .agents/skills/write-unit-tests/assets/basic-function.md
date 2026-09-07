```ts
import { DNamespace, type ExpectType } from "@scripts";

describe("functionName", () => {
	it("returns the expected result", () => {
		const result = DNamespace.functionName(input);

		type _CheckResult = ExpectType<
			typeof result,
			ExpectedResult,
			"strict"
		>;

		expect(result).toStrictEqual(expectedResult);
	});

	it("handles an edge case", () => {
		expect(
			DNamespace.functionName(edgeCaseInput),
		).toStrictEqual(expectedEdgeCaseResult);
	});
});
```