import { type RemoveKind, type Kind, unwrap } from "@duplojs/utils";
import * as EE from "@duplojs/utils/either";
import type * as DDP from "@duplojs/utils/dataParser";
import { createDuplojsServerUtilsKind } from "@scripts/kind";
import type { EligibleSpec, EligibleSpecOutput } from "./types";
import { addIssue, addIssueDataParser, type CommandError, type SymbolCommandError } from "./error";
import { specToDataParser } from "./spec";

export const argumentKind = createDuplojsServerUtilsKind("command-argument");

export interface Argument<
	GenericName extends string = string,
	GenericExecuteOutput extends unknown = unknown,
> extends Kind<typeof argumentKind.definition> {
	readonly name: GenericName;
	readonly spec: EligibleSpec;
	readonly dataParser: DDP.DataParser;
	readonly optional: boolean;
	readonly description?: string;
	execute(
		argument: string | undefined,
		error: CommandError,
	): Promise<
		| GenericExecuteOutput
		| SymbolCommandError
	>;
}

/**
 * {@include command/createArgument/index.md}
 */
export function createArgument<
	GenericName extends string,
	GenericEligibleSpec extends EligibleSpec,
>(
	name: GenericName,
	spec: GenericEligibleSpec,
	params?: {
		readonly description?: string;

		/**
		 * {@include command/createArgument/properties/optional.md}
		 */
		readonly optional?: false;
	},
): Argument<GenericName, EligibleSpecOutput<GenericEligibleSpec>>;

export function createArgument<
	GenericName extends string,
	GenericEligibleSpec extends EligibleSpec,
>(
	name: GenericName,
	spec: GenericEligibleSpec,
	params?: {
		readonly description?: string;

		/**
		 * {@include command/createArgument/properties/optional.md}
		 */
		readonly optional: boolean;
	},
): Argument<GenericName, EligibleSpecOutput<GenericEligibleSpec> | undefined>;

export function createArgument<
	GenericName extends string,
	GenericEligibleSpec extends EligibleSpec,
>(
	name: GenericName,
	spec: GenericEligibleSpec,
	params?: {
		readonly description?: string;
		readonly optional?: boolean;
	},
): any {
	const dataParser = specToDataParser(spec);

	const self = argumentKind.setTo(
		{
			name,
			spec,
			dataParser,
			description: params?.description,
			optional: params?.optional ?? false,
			execute: async(argument, error) => {
				if (self.optional === false && argument === undefined) {
					return addIssue(
						error,
						{
							type: "argument",
							target: name,
							expected: `required argument ${name}`,
							received: argument,
							message: `Argument "${name}" is required.`,
						},
					);
				}

				if (self.optional === true && argument === undefined) {
					return undefined;
				}

				const result = dataParser.isAsynchronous()
					? await dataParser.asyncParse(argument)
					: dataParser.parse(argument);

				if (EE.isLeft(result)) {
					return addIssueDataParser(
						error,
						unwrap(result),
						{
							type: "argument",
							target: name,
						},
					);
				}

				return unwrap(result);
			},
		} satisfies RemoveKind<Argument<string, unknown>>,
	);

	return self;
}
