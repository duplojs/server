import * as DCommon from "@duplojs/lang/common";
import type * as DKind from "@duplojs/lang/kind";
import * as DEither from "@duplojs/lang/either";
import * as DDataStructure from "@duplojs/lang/dataStructure";
import type * as DServerFile from "@scripts/file";
import { createKind } from "../kind";

export const sizeConstraintKind = createKind("size-constraint");

export interface SizeConstraintDefinition extends DDataStructure.ConstraintDefinition {
	min?: number;
	max?: number;
}

export interface SizeConstraintParams {
	min?: number | DCommon.BytesInString;
	max?: number | DCommon.BytesInString;
}

export interface SizeConstraint extends DCommon.UnionToIntersection<
	& DDataStructure.Constraint<
		DServerFile.FileInterface,
		DServerFile.FileInterface,
		SizeConstraintDefinition
	>
	& DKind.Kind<typeof sizeConstraintKind>
> {}

export const SizeConstraint = DDataStructure.createConstraint(
	sizeConstraintKind,
	({ init }) => (
		params: SizeConstraintParams,
	) => init<SizeConstraint>(
		{
			max: params.max === undefined
				? undefined
				: DCommon.stringToBytes(params.max),
			min: params.min === undefined
				? undefined
				: DCommon.stringToBytes(params.min),
		},
		{
			executeCheck: async(self, data) => {
				const result = DEither.rightPipe(
					await data.stat(),
					(stat) => {
						if (!stat.isFile) {
							return DEither.fail();
						}

						if (
							self.definition.max !== undefined
							&& stat.sizeBytes > self.definition.max
						) {
							return DEither.fail();
						}

						if (
							self.definition.min !== undefined
							&& stat.sizeBytes < self.definition.min
						) {
							return DEither.fail();
						}

						return stat;
					},
				);

				if (DEither.isLeft(result)) {
					return DDataStructure.ErrorSymbol;
				}

				return DDataStructure.SuccessSymbol;
			},
			isAsynchronous: () => true,
		},
	),
);
