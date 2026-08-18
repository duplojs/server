import type { ComputedTypeError } from "@duplojs/utils";

export type ForbiddenDuplicateName<
	GenericItems extends readonly { readonly name: string }[],
	GenericType extends string,
	GenericSeenNames extends string = never,
> = GenericItems extends readonly [
	infer InferredFirstItem extends { readonly name: string },
	...infer InferredRestItems extends { readonly name: string }[],
]
	? InferredFirstItem["name"] extends GenericSeenNames
		? ComputedTypeError<`Duplicate ${GenericType} name "${InferredFirstItem["name"]}"`>
		: ForbiddenDuplicateName<
			InferredRestItems,
			GenericType,
			GenericSeenNames | InferredFirstItem["name"]
		>
	: unknown;
