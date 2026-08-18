import type * as DDP from "@duplojs/lang/dataParser";
import type { ComputeEligibleCleanType, EligibleCleanType } from "./eligibleCleanType";
import type { EligibleDataParser } from "./eligibleDataParser";

export type EligibleSpec = (
	| EligibleDataParser
	| EligibleCleanType
);

export type EligibleSpecOutput<
	GenericEligibleSpec extends EligibleSpec,
> = [GenericEligibleSpec] extends [DDP.DataParser]
	? DDP.Output<GenericEligibleSpec>
	: [GenericEligibleSpec] extends [EligibleCleanType]
		? ComputeEligibleCleanType<GenericEligibleSpec>
		: never;
