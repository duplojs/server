import * as DCommon from "@duplojs/lang/common";
import type * as DKind from "@duplojs/lang/kind";
import * as DDataStructure from "@duplojs/lang/dataStructure";
import type * as DServerFile from "@scripts/file";
import { createKind } from "../kind";

export const mimeTypeConstraintKind = createKind("mime-type-constraint");

export interface MimeTypeConstraintDefinition extends DDataStructure.ConstraintDefinition {
	regex: RegExp;
}

export interface MimeTypeConstraint extends DCommon.UnionToIntersection<
	& DDataStructure.Constraint<
		DServerFile.FileInterface,
		DServerFile.FileInterface,
		MimeTypeConstraintDefinition
	>
	& DKind.Kind<typeof mimeTypeConstraintKind>
> {}

export const MimeTypeConstraint = DDataStructure.createConstraint(
	mimeTypeConstraintKind,
	({ init }) => (
		mimeType: Parameters<typeof DCommon.toRegExp>[0],
	) => init<MimeTypeConstraint>(
		{
			regex: DCommon.toRegExp(mimeType),
		},
		{
			executeCheck: (self, data) => {
				if (self.definition.regex.test(data.getMimeType() ?? "")) {
					return DDataStructure.ErrorSymbol;
				}

				return DDataStructure.SuccessSymbol;
			},
			isAsynchronous: () => false,
		},
	),
);
