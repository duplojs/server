import { type RemoveKind, type Kind } from "@duplojs/lang";
import { initOption, type Option } from "./base";
import { createKind } from "@scripts/kind";

export const booleanOptionKind = createKind("command-boolean-option");

type _BooleanOption<
	GenericName extends string = string,
> = (
	& Option<
		GenericName,
		boolean
	>
	& Kind<typeof booleanOptionKind.definition>
);

export interface BooleanOption<
	GenericName extends string = string,
> extends _BooleanOption<GenericName> {}

export function createBooleanOption<
	GenericName extends string,
>(
	name: GenericName,
	params?: {
		description?: string;

		/**
		 * {@include command/properties/aliases.md}
		 */
		aliases?: readonly string[];
	},
): BooleanOption<GenericName> {
	return booleanOptionKind.setTo(
		{
			...initOption(
				name,
				({ isHere }) => isHere,
				params,
			),
		} satisfies RemoveKind<BooleanOption<GenericName>>,
	);
}
