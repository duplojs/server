```ts
import { DNamespace, type ExpectType, pipe } from "@scripts";

describe("functionName", () => {
	it("supports direct call", () => {
		const result = DNamespace.functionName(input, params);

		type _CheckResult = ExpectType<
			typeof result,
			ExpectedResult,
			"strict"
		>;

		expect(result).toStrictEqual(expectedResult);
	});

	it("preserves inference in a pipe", () => {
		const result = pipe(
			input,
			DNamespace.functionName(params),
		);

		type _CheckResult = ExpectType<
			typeof result,
			ExpectedResult,
			"strict"
		>;

		expect(result).toStrictEqual(expectedResult);
	});
});
```
