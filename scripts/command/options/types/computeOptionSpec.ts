import type * as DDP from "@duplojs/lang/dataParser";
import type { ComputeEligibleCleanType, EligibleCleanType, EligibleSpec } from "../../types";

export type ComputeOptionSpec<
	GenericSpec extends EligibleSpec,
> = [GenericSpec] extends [DDP.DataParser]
	? DDP.Output<GenericSpec>
	: [GenericSpec] extends [EligibleCleanType]
		? ComputeEligibleCleanType<GenericSpec>
		: never;
