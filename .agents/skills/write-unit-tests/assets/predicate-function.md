```ts
import { DNamespace, type ExpectType, pipe, when } from "@scripts";

describe("functionName", () => {
	it("narrows the direct input", () => {
		const input = value as Input;

		if (DNamespace.functionName(input, predicateParams)) {
			type _CheckInput = ExpectType<
				typeof input,
				NarrowedInput,
				"strict"
			>;
		}
	});

	it("returns the expected runtime result", () => {
		expect(
			DNamespace.functionName(input, predicateParams),
		).toBe(expectedResult);
	});

	it("preserves narrowing in a pipe", () => {
		const result = pipe(
			input,
			when(
				DNamespace.functionName(predicateParams),
				(value) => {
					type _CheckValue = ExpectType<
						typeof value,
						NarrowedInput,
						"strict"
					>;

					return transform(value);
				},
			),
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

Omettre `predicateParams` lorsque la fonction predicate ne prend aucune configuration.
