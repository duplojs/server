import * as DDataStructure from "@duplojs/lang/dataStructure";
import type * as DServerFile from "@scripts/file";
import { FileType } from "../type";

export function file<
	const GenericConstraints extends readonly DDataStructure.Constraint<DServerFile.FileInterface>[] = readonly [],
>(
	constraints: GenericConstraints = [] as never,
) {
	return DDataStructure.TypeStructure(
		FileType(),
		constraints,
	);
}
