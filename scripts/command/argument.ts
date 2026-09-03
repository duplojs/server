import type * as DCommon from "@duplojs/lang/common";
import type * as DKind from "@duplojs/lang/kind";
import * as DEither from "@duplojs/lang/either";
import type * as DDataStructure from "@duplojs/lang/dataStructure";
import * as DServerDataStructure from "@scripts/dataStructure";
import { createKind } from "@scripts/kind";
import { type Error, type SymbolCommandError } from "./error";
import { type EligibleType } from "./types";

export const argumentKind = createKind("command-argument");

export interface Argument<
	GenericName extends string = string,
	GenericValue extends EligibleType = EligibleType,
> extends DKind.Kind<typeof argumentKind> {
	readonly name: GenericName;
	readonly dataStructure: DDataStructure.Structure<GenericValue>;
	readonly optional: boolean;
	readonly description: string | null;
	execute(
		argument: string | undefined,
		error: Error,
	): Promise<
		| GenericValue
		| SymbolCommandError
	>;
}

export interface CreateArgumentParams {
	readonly description?: string;
	readonly optional?: boolean;
}

export function createArgument<
	GenericName extends string,
	GenericStructure extends DDataStructure.Structure<EligibleType>,
	GenericValue extends DDataStructure.StructureValue<GenericStructure>,
	const GenericParams extends CreateArgumentParams = {},
>(
	name: GenericName,
	dataStructure: GenericStructure,
	params?: GenericParams,
): Argument<
	GenericName,
	(
		| GenericValue
		| (
			DCommon.IsEqual<GenericParams["optional"], true> extends true
				? undefined
				: never
		)
	)
>;

export function createArgument(
	name: string,
	dataStructure: DDataStructure.Structure<EligibleType>,
	params?: CreateArgumentParams,
): any {
	const self: Argument = {
		name,
		dataStructure,
		description: params?.description ?? null,
		optional: params?.optional ?? false,
		execute: async(argument, error) => {
			if (self.optional === false && argument === undefined) {
				return error.addRequiredArgumentCommandIssue(
					self.name,
				);
			}

			if (argument === undefined) {
				return undefined;
			}

			const result = await self.dataStructure.asyncDecode(
				DServerDataStructure.codecsString,
				argument,
			);

			if (DEither.isLeft(result)) {
				return error.addDataStructureArgumentCommandIssue(
					self.name,
					argument,
					DEither.unwrapLeft(result),
				);
			}

			return DEither.unwrapRight(result);
		},
		[argumentKind.runTimeKey]: null,
	} satisfies DKind.Remove<Argument> as never;

	return self;
}
