import { type Kind, pipe, type RemoveKind, unwrap } from "@duplojs/utils";
import * as SS from "@duplojs/utils/string";
import * as DDP from "@duplojs/utils/dataParser";
import type * as AA from "@duplojs/utils/array";
import * as EE from "@duplojs/utils/either";
import { initOption, type Option } from "./base";
import type { EligibleSpec } from "../types";
import type { ComputeOptionSpec } from "./types";
import { addIssue, addIssueDataParser } from "../error";
import { specToDataParser } from "../spec";
import { createDuplojsServerUtilsKind } from "@scripts/kind";

const defaultSeparator = ",";

export const arrayOptionKind = createDuplojsServerUtilsKind("command-array-option");

type _ArrayOption<
	GenericName extends string = string,
	GenericExecuteOutputValue extends unknown = unknown,
> = (
	& Option<
		GenericName,
		GenericExecuteOutputValue
	>
	& Kind<typeof arrayOptionKind.definition>
);

export interface ArrayOption<
	GenericName extends string = string,
	GenericExecuteOutputValue extends unknown = unknown,
> extends _ArrayOption<GenericName, GenericExecuteOutputValue> {
	readonly spec: EligibleSpec;
	readonly dataParser: DDP.DataParser;
	readonly required: boolean;
	readonly separator: string;
	readonly min?: number;
	readonly max?: number;
}

/**
 * {@include command/createArrayOption/index.md}
 */
export function createArrayOption<
	GenericName extends string,
	GenericSpec extends EligibleSpec,
	GenericMinValues extends number,
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
		 * {@include command/createArrayOption/properties/min.md}
		 */
		min?: GenericMinValues;

		/**
		 * {@include command/createArrayOption/properties/max.md}
		 */
		max?: number;

		/**
		 * {@include command/properties/requiredOption.md}
		 */
		required: true;

		/**
		 * {@include command/createArrayOption/properties/separator.md}
		 */
		separator?: string;
	},
): ArrayOption<
	GenericName,
	[
		...AA.CreateTuple<
			ComputeOptionSpec<GenericSpec>,
			GenericMinValues
		>,
		...ComputeOptionSpec<GenericSpec>[],
	]
>;

export function createArrayOption<
	GenericName extends string,
	GenericSpec extends EligibleSpec,
	GenericMinValues extends number,
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

		/**
		 * {@include command/createArrayOption/properties/min.md}
		 */
		min?: GenericMinValues;

		/**
		 * {@include command/createArrayOption/properties/max.md}
		 */
		max?: number;

		/**
		 * {@include command/createArrayOption/properties/separator.md}
		 */
		separator?: string;
	},
): ArrayOption<
	GenericName,
	| [
		...AA.CreateTuple<
			ComputeOptionSpec<GenericSpec>,
			GenericMinValues
		>,
		...ComputeOptionSpec<GenericSpec>[],
	]
	| undefined
>;

export function createArrayOption(
	name: string,
	spec: EligibleSpec,
	params?: {
		description?: string;
		aliases?: readonly string[];
		required?: boolean;
		min?: number;
		max?: number;
		separator?: string;
	},
): any {
	const dataParser = pipe(
		spec,
		specToDataParser,
		DDP.array,
		(parser) => params?.min
			? parser.addChecker(DDP.checkerArrayMin(params.min))
			: parser,
		(parser) => params?.max
			? parser.addChecker(DDP.checkerArrayMax(params.max))
			: parser,
	);

	const self: ArrayOption = arrayOptionKind.setTo(
		{
			spec,
			dataParser,
			required: params?.required ?? false,
			min: params?.min,
			max: params?.max,
			separator: params?.separator ?? defaultSeparator,
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

					const values = value !== undefined
						? SS.split(value, self.separator)
						: undefined;

					const result = dataParser.isAsynchronous()
						? await dataParser.asyncParse(values)
						: dataParser.parse(values);

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
		} satisfies RemoveKind<ArrayOption<string, unknown>>,
	);

	return self;
}
