import type * as DCommon from "@duplojs/lang/common";
import type * as DKind from "@duplojs/lang/kind";
import * as DEither from "@duplojs/lang/either";
import * as DDataStructure from "@duplojs/lang/dataStructure";
import type * as DServerFile from "@scripts/file";
import { createKind } from "../kind";

export const existConstraintKind = createKind("exist-constraint");

export interface ExistConstraintDefinition extends DDataStructure.ConstraintDefinition {
}

export interface ExistConstraint extends DCommon.UnionToIntersection<
	& DDataStructure.Constraint<
		DServerFile.FileInterface,
		DServerFile.FileInterface,
		ExistConstraintDefinition
	>
	& DKind.Kind<typeof existConstraintKind>
> {}

export const ExistConstraint = DDataStructure.createConstraint(
	existConstraintKind,
	({ init }) => () => init<ExistConstraint>(
		{ },
		{
			executeCheck: async(_self, data) => {
				const result = DEither.rightPipe(
					await data.stat(),
					(stat) => stat.isFile
						? stat
						: DEither.fail(),
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
