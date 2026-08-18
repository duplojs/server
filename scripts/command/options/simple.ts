import { type Kind, type RemoveKind, unwrap } from "@duplojs/utils";
import * as EE from "@duplojs/utils/either";
import type * as DDP from "@duplojs/utils/dataParser";
import { initOption, type Option } from "./base";
import type { EligibleSpec } from "../types";
import type { ComputeOptionSpec } from "./types";
import { addIssue, addIssueDataParser } from "../error";
import { specToDataParser } from "../spec";
import { createDuplojsServerUtilsKind } from "@scripts/kind";

export const simpleOptionKind = createDuplojsServerUtilsKind("command-simple-option");

type _SimpleOption<
	GenericName extends string = string,
	GenericExecuteOutputValue extends unknown = unknown,
> = (
	& Option<
		GenericName,
		GenericExecuteOutputValue
	>
	& Kind<typeof simpleOptionKind.definition>
);

export interface SimpleOption<
	GenericName extends string = string,
	GenericExecuteOutputValue extends unknown = unknown,
> extends _SimpleOption<GenericName, GenericExecuteOutputValue> {
	readonly spec: EligibleSpec;
	readonly dataParser: DDP.DataParser;
	readonly required: boolean;
}

/**
 * {@include command/createOption/index.md}
 */
export function createOption<
	GenericName extends string,
	GenericSpec extends EligibleSpec,
	GenericOutput extends ComputeOptionSpec<GenericSpec> = ComputeOptionSpec<GenericSpec>,
>(
	name: GenericName,
	spec: GenericSpec,
	params: {
		description?: string;

		/**
		 * {@include command/properties/aliases.md}
		 */
		aliases?: readonly string[];

		/**
		 * {@include command/properties/requiredOption.md}
		 */
		required: true;
	},
): SimpleOption<GenericName, GenericOutput>;

export function createOption<
	GenericName extends string,
	GenericSpec extends EligibleSpec,
	GenericOutput extends ComputeOptionSpec<GenericSpec> = ComputeOptionSpec<GenericSpec>,
>(
	name: GenericName,
	spec: GenericSpec,
	params?: {
		description?: string;

		/**
		 * {@include command/properties/aliases.md}
		 */
		aliases?: readonly string[];

		/**
		 * {@include command/properties/requiredOption.md}
		 */
		required?: boolean;
	},
): SimpleOption<GenericName, GenericOutput | undefined>;

export function createOption(
	name: string,
	spec: EligibleSpec,
	params?: {
		description?: string;
		aliases?: readonly string[];
		required?: boolean;
	},
): any {
	const dataParser = specToDataParser(spec);

	const self: SimpleOption = simpleOptionKind.setTo(
		{
			spec,
			dataParser,
			required: params?.required ?? false,
			...initOption(
				name,
				async({ isHere, value }, error) => {
					if (!isHere && self.required === true) {
						return addIssue(
							error,
							{
								type: "option",
								target: name,
								expected: `required option --${name}`,
								received: value,
								message: `Option "${name}" is required.`,
							},
						);
					}

					if (!isHere && self.required === false) {
						return undefined;
					}

					const result = dataParser.isAsynchronous()
						? await dataParser.asyncParse(value)
						: dataParser.parse(value);

					if (EE.isLeft(result)) {
						return addIssueDataParser(
							error,
							unwrap(result),
							{
								type: "option",
								target: name,
							},
						);
					}

					return unwrap(result);
				},
				{
					description: params?.description,
					aliases: params?.aliases,
					hasValue: true,
				},
			),
		} satisfies RemoveKind<SimpleOption<string, unknown>>,
	);

	return self;
}
