import type * as DCommon from "@duplojs/lang/common";
import type * as DKind from "@duplojs/lang/kind";
import * as DEither from "@duplojs/lang/either";
import type * as DDataStructure from "@duplojs/lang/dataStructure";
import * as DServerDataStructure from "@scripts/dataStructure";
import { createOption, type Option } from "../base";
import type { EligibleType } from "../types";
import { createKind } from "@scripts/kind";

export const simpleOptionKind = createKind("command-simple-option");

export interface SimpleOption<
	GenericName extends string = string,
	GenericValue extends EligibleType = EligibleType,
> extends DCommon.Forward<
		& Option<
			GenericName,
			GenericValue
		>
		& DKind.Kind<typeof simpleOptionKind>
	> {
	readonly dataStructure: DDataStructure.Structure<GenericValue>;
	readonly required: boolean;
}

export interface CreateSimpleOptionParams {
	description?: string;
	aliases?: readonly string[];
	required?: boolean;
}

export const createSimpleOption = createOption(
	simpleOptionKind,
	({ init }) => <
		GenericName extends string,
		GenericValue extends EligibleType,
		const GenericParams extends CreateSimpleOptionParams = {},
	>(
		name: GenericName,
		dataStructure: DDataStructure.Structure<GenericValue>,
		params: GenericParams,
	): SimpleOption<
		GenericName,
		(
			| GenericValue
			| (
				DCommon.IsEqual<GenericParams["required"], true> extends true
					? never
					: undefined
			)
		)
	> => init<SimpleOption>(
		name,
		async(self, value, error) => {
			if (value === null && self.required === true) {
				return error.addRequiredOptionCommandIssue(
					self.name,
					undefined,
				);
			}

			if (value === null) {
				return undefined;
			}

			if (value === undefined) {
				return error.addRequiredOptionValueCommandIssue(
					self.name,
				);
			}

			const result = await self.dataStructure.asyncUnsafeDecode(
				DServerDataStructure.codecsString,
				value,
			);

			if (DEither.isLeft(result)) {
				return error.addDataStructureOptionCommandIssue(
					self.name,
					value,
					DEither.unwrapLeft(result),
				);
			}

			return DEither.unwrapRight(result);
		},
		{
			description: params?.description ?? null,
			aliases: params?.aliases ?? [],
		},
		{
			dataStructure: dataStructure,
			required: params.required ?? false,
		},
	) as never,
);
