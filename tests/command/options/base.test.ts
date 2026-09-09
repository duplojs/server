import type * as DCommon from "@duplojs/lang/common";
import type * as DKind from "@duplojs/lang/kind";
import { DServerCommand } from "@scripts";

describe("constructOption", () => {
	it("binds function properties to the created option", () => {
		interface CustomOption extends DCommon.Forward<
			& DServerCommand.Option<"target", "value">
			& DKind.Kind<typeof DServerCommand.booleanOptionKind>
		> {
			format(prefix: string): string;
			readonly readonlyValue: string;
		}

		const createCustomOption = DServerCommand.constructOption(
			DServerCommand.booleanOptionKind,
			({ init }) => () => init<CustomOption>(
				"target",
				() => "value",
				{
					description: null,
					aliases: [],
				},
				{
					format: (self, prefix: string) => `${prefix}${self.name}`,
					readonlyValue: "static",
				},
			),
		);

		const option = createCustomOption();

		expect(option.format("option:")).toBe("option:target");
		expect(option.readonlyValue).toBe("static");
		expect(DServerCommand.optionKind.has(option)).toBe(true);
		expect(DServerCommand.booleanOptionKind.has(option)).toBe(true);
	});

	it("uses default metadata when params are missing", () => {
		interface CustomOption extends DCommon.Forward<
			& DServerCommand.Option<"target", "value">
			& DKind.Kind<typeof DServerCommand.booleanOptionKind>
		> {}

		const createCustomOption = DServerCommand.constructOption(
			DServerCommand.booleanOptionKind,
			({ init }) => () => init<CustomOption>(
				"target",
				() => "value",
				null as never,
			),
		);

		const option = createCustomOption();

		expect(option.aliases).toEqual([]);
		expect(option.description).toBeNull();
	});
});
