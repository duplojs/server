import * as DDP from "@duplojs/utils/dataParser";
import * as CC from "@duplojs/utils/clean";
import * as SDP from "@scripts/dataParser";
import type { EligibleCleanType, EligibleSpec } from "./types";
import { type ExpectType, hasSomeKinds } from "@duplojs/utils";

export function specToDataParser(value: EligibleSpec): DDP.DataParser {
	if (
		hasSomeKinds(value, [
			DDP.stringKind,
			DDP.numberKind,
			DDP.bigIntKind,
			DDP.dateKind,
			DDP.timeKind,
			DDP.nilKind,
			SDP.fileKind,
		])
	) {
		const clone = value.clone();

		(clone.definition.coerce as any) = true;

		return clone;
	} else if (
		DDP.identifier(value, DDP.dataParserKind)
	) {
		return value;
	} else {
		type _check = ExpectType<
			typeof value,
			EligibleCleanType,
			"strict"
		>;

		return CC.toMapDataParser(
			value as never,
			{ coerce: true },
		);
	}
}
