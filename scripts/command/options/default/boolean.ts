import type * as DCommon from "@duplojs/lang/common";
import type * as DKind from "@duplojs/lang/kind";
import { createOption, type Option } from "../base";
import { createKind } from "@scripts/kind";

export const booleanOptionKind = createKind("command-boolean-option");

export interface BooleanOption<
	GenericName extends string = string,
> extends DCommon.Forward<
		& Option<
			GenericName,
			boolean
		>
		& DKind.Kind<typeof booleanOptionKind>
	> {}

export interface CreateBooleanOptionParams {
	description?: string;
	aliases?: readonly string[];
}

export const createBooleanOption = createOption(
	booleanOptionKind,
	({ init }) => <
		GenericName extends string,
	>(
		name: GenericName,
		params?: CreateBooleanOptionParams,
	) => init<
		BooleanOption<GenericName>
	>(
		name,
		(self, value, error) => {
			if (typeof value === "string") {
				return error.addUnexpectedOptionValueCommandIssue(
					self.name,
					value,
				);
			}

			return value !== null;
		},
		{
			description: params?.description ?? null,
			aliases: params?.aliases ?? [],
		},
	),
);
