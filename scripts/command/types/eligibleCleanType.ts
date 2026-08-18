import type { AnyTuple } from "@duplojs/lang";
import type * as CC from "@duplojs/lang/clean";
import type * as DD from "@duplojs/lang/date";

export type EligiblePrimitive = string | number | boolean | bigint | DD.TheDate | DD.TheTime;

export type EligibleEntityProperty = (
	| CC.NewTypeHandler<any, EligiblePrimitive, readonly any[], any>
	| CC.EntityPropertyDefinitionUnion<AnyTuple<EligibleEntityProperty>>
	| CC.EntityPropertyDefinitionNullable<EligibleEntityProperty>
	| CC.EntityPropertyDefinitionIdentifier<string>
);

export type EligibleCleanType = (
	| CC.ConstraintHandler
	| CC.ConstraintsSetHandler
	| CC.PrimitiveHandler
	| EligibleEntityProperty
);

export type ComputeEligibleCleanType<
	GenericCleanType extends EligibleCleanType,
> = [GenericCleanType] extends [CC.ConstraintHandler<any, any, readonly any[], any>]
	? CC.GetConstraint<GenericCleanType>
	: [GenericCleanType] extends [CC.ConstraintsSetHandler<any, readonly any[], any>]
		? CC.GetConstraints<GenericCleanType>
		: [GenericCleanType] extends [CC.PrimitiveHandler]
			? ReturnType<GenericCleanType["createWithUnknownOrThrow"]>
			: [GenericCleanType] extends [EligibleEntityProperty]
				? CC.EntityProperty<GenericCleanType>
				: never;
