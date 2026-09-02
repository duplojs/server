import * as DCommon from "@duplojs/lang/common";
import type * as DKind from "@duplojs/lang/kind";
import * as DDataStructure from "@duplojs/lang/dataStructure";
import type * as DNumber from "@duplojs/lang/number";
import type * as DArray from "@duplojs/lang/array";
import * as DEither from "@duplojs/lang/either";
import * as DServerDataStructure from "@scripts/dataStructure";
import { createOption, type Option } from "../base";
import type { EligibleType } from "../types";
import { createKind } from "../../../kind";

const defaultSeparator = ",";

export const arrayOptionKind = createKind("command-array-option");

export interface ArrayOption<
	GenericName extends string = string,
	GenericValue extends (readonly EligibleType[] | undefined) = (readonly EligibleType[] | undefined),
> extends DCommon.Forward<
		& Option<
			GenericName,
			GenericValue
		>
		& DKind.Kind<typeof arrayOptionKind>
	> {
	readonly dataStructure: DDataStructure.Structure<GenericValue>;
	readonly required: boolean;
	readonly separator: string;
	readonly min?: number;
	readonly max?: number;
}

export interface CreateArrayOptionParams {
	description?: string;
	aliases?: readonly string[];
	min?: number;
	max?: number;
	required?: boolean;
	separator?: string;
}

export const createArrayOption = createOption(
	arrayOptionKind,
	({ init }) => <
		GenericName extends string,
		GenericValue extends EligibleType,
		const GenericParams extends CreateArrayOptionParams = {},
	>(
		name: GenericName,
		dataStructure: DDataStructure.Structure<GenericValue>,
		params?: GenericParams,
	): ArrayOption<
		GenericName,
		(
			| (
				& readonly GenericValue[]
				& (
					DNumber.IsLiteral<Extract<GenericParams["min"], number>> extends true
						? DArray.MinElements<Extract<GenericParams["min"], number>>
						: unknown
				)
				& (
					DNumber.IsLiteral<Extract<GenericParams["max"], number>> extends true
						? DArray.MaxElements<Extract<GenericParams["max"], number>>
						: unknown
				)
			)
			| (
				DCommon.IsEqual<GenericParams["required"], true> extends true
					? never
					: undefined
			)
		)
	> => init<ArrayOption>(
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
			dataStructure: DCommon.justExec(() => DCommon.pipe(
				dataStructure,
				DDataStructure.array,
				(dataStructure) => params?.min
					? dataStructure.addConstraint(DDataStructure.minElements(params.min))
					: dataStructure,
				(dataStructure) => params?.max
					? dataStructure.addConstraint(DDataStructure.maxElements(params.max))
					: dataStructure,
			)),
			required: params?.required ?? false,
			min: params?.min,
			max: params?.max,
			separator: params?.separator ?? defaultSeparator,
		},
	) as never,
);
