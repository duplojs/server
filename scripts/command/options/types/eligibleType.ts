import type * as DObject from "@duplojs/lang/object";
import type * as DDataStructure from "@duplojs/lang/dataStructure";

export type EligibleType = DDataStructure.FundamentalTypeValue<
	DObject.Values<
		typeof DDataStructure.codecsString.definition
	>["fundamentalType"]
>;
