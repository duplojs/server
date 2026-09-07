import type * as DCommon from "@duplojs/lang/common";
import type * as DKind from "@duplojs/lang/kind";
import * as DDataStructure from "@duplojs/lang/dataStructure";
import type * as DServerFile from "@scripts/file";
import * as FundamentalType from "../fundamentalType";
import { createKind } from "../kind";

export const fileTypeKind = createKind("file-type");

export interface TimeTypeDefinition extends DDataStructure.TypeDefinition {}

export interface FileType extends DCommon.UnionToIntersection<
	& DDataStructure.Type<
		FundamentalType.TheFile,
		DServerFile.FileInterface,
		TimeTypeDefinition
	>
	& DKind.Kind<typeof fileTypeKind>
> {

}

export const FileType = DDataStructure.createType(
	FundamentalType.TheFile,
	fileTypeKind,
	({ init }) => () => init<FileType>(
		{},
		{
			executeCheck: () => DDataStructure.SuccessSymbol,
			isAsynchronous: () => false,
		},
	),
);
