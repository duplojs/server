// oxlint-disable no-nested-ternary
import * as DCommon from "@duplojs/lang/common";
import * as DArray from "@duplojs/lang/array";
import * as DString from "@duplojs/lang/string";
import * as DPrinter from "@duplojs/lang/printer";
import * as DPattern from "@duplojs/lang/pattern";
import * as DDataStructure from "@duplojs/lang/dataStructure";
import * as DServerDataStructure from "@scripts/dataStructure";
import type { Command } from "./create";
import type { Argument } from "./argument";
import { arrayOptionKind, booleanOptionKind, createBooleanOption, simpleOptionKind, type Options } from "./options";

export const helpOption = createBooleanOption("help", { aliases: ["h"] });

interface DataStructureHelp {
	readonly main: readonly DPrinter.RenderInput[];
	readonly constraints: readonly (readonly DPrinter.RenderInput[])[];
}

const syntax = (input: string) => DPrinter.colorized(input, "gray");
const section = (input: string, color: DPrinter.Colors) => DPrinter.colorizedBold(input, color);
const name = (input: string) => DPrinter.colorizedBold(input, "cyan");
const typeLabel = (input: string) => DPrinter.colorized(input, "blue");
const literal = (input: string) => DPrinter.colorized(input, "yellow");
const marker = (input: string) => DPrinter.colorized(input, "yellow");
const secondary = (input: string) => DPrinter.colorized(input, "gray");
const constraintLabel = (input: string) => DPrinter.colorized(input, "magenta");

function renderInline(
	input: readonly DPrinter.RenderInput[],
) {
	return DPrinter.render(input, "");
}

function formatLiteral(value: unknown) {
	if (typeof value === "string") {
		return JSON.stringify(value);
	}

	if (typeof value === "bigint") {
		return `${value.toString()}n`;
	}

	return String(value);
}

function formatBytes(value: number) {
	const units = ["B", "KB", "MB", "GB", "TB"] as const;
	let size = value;
	let index = 0;

	while (size >= 1024 && index < units.length - 1) {
		size = size / 1024;
		index++;
	}

	return `${Number.isInteger(size) ? size : size.toFixed(1)} ${units[index]}`;
}

function renderType(
	type: DDataStructure.Type,
) {
	return DPattern.match(type)
		.when(
			DDataStructure.typeIdentifier(DDataStructure.stringLiteralTypeKind),
			({ definition }) => [literal(formatLiteral(definition.value))],
		)
		.when(
			DDataStructure.typeIdentifier(DDataStructure.numberLiteralTypeKind),
			({ definition }) => [literal(formatLiteral(definition.value))],
		)
		.when(
			DDataStructure.typeIdentifier(DDataStructure.bigintLiteralTypeKind),
			({ definition }) => [literal(formatLiteral(definition.value))],
		)
		.when(
			DDataStructure.typeIdentifier(DDataStructure.booleanLiteralTypeKind),
			({ definition }) => [literal(formatLiteral(definition.value))],
		)
		.when(
			DDataStructure.typeIdentifier(DDataStructure.nullTypeKind),
			DCommon.justReturn([literal("null")]),
		)
		.when(
			DDataStructure.typeIdentifier(DDataStructure.undefinedTypeKind),
			DCommon.justReturn([literal("undefined")]),
		)
		.when(
			DDataStructure.typeIdentifier(DDataStructure.stringTypeKind),
			DCommon.justReturn([typeLabel("string")]),
		)
		.when(
			DDataStructure.typeIdentifier(DDataStructure.numberTypeKind),
			DCommon.justReturn([typeLabel("number")]),
		)
		.when(
			DDataStructure.typeIdentifier(DDataStructure.bigintTypeKind),
			DCommon.justReturn([typeLabel("bigint")]),
		)
		.when(
			DDataStructure.typeIdentifier(DDataStructure.booleanTypeKind),
			DCommon.justReturn([typeLabel("boolean")]),
		)
		.when(
			DDataStructure.typeIdentifier(DDataStructure.dateTypeKind),
			DCommon.justReturn([typeLabel("date")]),
		)
		.when(
			DDataStructure.typeIdentifier(DDataStructure.timeTypeKind),
			DCommon.justReturn([typeLabel("time")]),
		)
		.when(
			DDataStructure.typeIdentifier(DServerDataStructure.fileTypeKind),
			DCommon.justReturn([typeLabel("file")]),
		)
		.otherwise(
			DCommon.justReturn([typeLabel("unknown")]),
		);
}

function renderStringLength(
	constraints: readonly DDataStructure.Constraint[],
) {
	const equal = DArray.find(
		constraints,
		DDataStructure.constraintIdentifier(DDataStructure.stringLengthEqualConstraintKind),
	);
	const min = DArray.find(
		constraints,
		DDataStructure.constraintIdentifier(DDataStructure.minCharactersConstraintKind),
	);
	const max = DArray.find(
		constraints,
		DDataStructure.constraintIdentifier(DDataStructure.maxCharactersConstraintKind),
	);

	if (equal) {
		return [constraintLabel("length "), literal(String(equal.definition.length))];
	}

	if (min && max) {
		return [constraintLabel("length "), literal(`${min.definition.min}..${max.definition.max}`)];
	}

	if (min) {
		return [constraintLabel("min length "), literal(String(min.definition.min))];
	}

	if (max) {
		return [constraintLabel("max length "), literal(String(max.definition.max))];
	}

	return null;
}

function renderArrayLength(
	constraints: readonly DDataStructure.Constraint[],
) {
	const equal = DArray.find(
		constraints,
		DDataStructure.constraintIdentifier(DDataStructure.arrayLengthEqualConstraintKind),
	);
	const min = DArray.find(
		constraints,
		DDataStructure.constraintIdentifier(DDataStructure.minElementsConstraintKind),
	);
	const max = DArray.find(
		constraints,
		DDataStructure.constraintIdentifier(DDataStructure.maxElementsConstraintKind),
	);

	if (equal) {
		return [constraintLabel("items "), literal(String(equal.definition.length))];
	}

	if (min && max) {
		return [constraintLabel("items "), literal(`${min.definition.min}..${max.definition.max}`)];
	}

	if (min) {
		return [constraintLabel("min items "), literal(String(min.definition.min))];
	}

	if (max) {
		return [constraintLabel("max items "), literal(String(max.definition.max))];
	}

	return null;
}

function renderNumberBounds(
	constraints: readonly DDataStructure.Constraint[],
) {
	const greaterThan = DArray.find(
		constraints,
		DDataStructure.constraintIdentifier(DDataStructure.greaterThanConstraintKind),
	);
	const greaterThanOrEqual = DArray.find(
		constraints,
		DDataStructure.constraintIdentifier(DDataStructure.greaterThanOrEqualConstraintKind),
	);
	const lessThan = DArray.find(
		constraints,
		DDataStructure.constraintIdentifier(DDataStructure.lessThanConstraintKind),
	);
	const lessThanOrEqual = DArray.find(
		constraints,
		DDataStructure.constraintIdentifier(DDataStructure.lessThanOrEqualConstraintKind),
	);

	return DArray.filter(
		[
			greaterThan
				? [constraintLabel("> "), literal(String(greaterThan.definition.threshold))]
				: greaterThanOrEqual
					? [constraintLabel("min "), literal(String(greaterThanOrEqual.definition.threshold))]
					: null,
			lessThan
				? [constraintLabel("< "), literal(String(lessThan.definition.threshold))]
				: lessThanOrEqual
					? [constraintLabel("max "), literal(String(lessThanOrEqual.definition.threshold))]
					: null,
		],
		DCommon.truthy,
	);
}

function renderSimpleConstraint(
	constraint: DDataStructure.Constraint,
) {
	return DPattern.match(constraint)
		.when(
			DDataStructure.constraintIdentifier(DDataStructure.emailConstraintKind),
			DCommon.justReturn([constraintLabel("email")]),
		)
		.when(
			DDataStructure.constraintIdentifier(DDataStructure.urlConstraintKind),
			DCommon.justReturn([constraintLabel("url")]),
		)
		.when(
			DDataStructure.constraintIdentifier(DDataStructure.uuidConstraintKind),
			DCommon.justReturn([constraintLabel("uuid")]),
		)
		.when(
			DDataStructure.constraintIdentifier(DDataStructure.integerConstraintKind),
			DCommon.justReturn([constraintLabel("integer")]),
		)
		.when(
			DDataStructure.constraintIdentifier(DDataStructure.trimmedConstraintKind),
			DCommon.justReturn([constraintLabel("trimmed")]),
		)
		.when(
			DDataStructure.constraintIdentifier(DDataStructure.notEmptyConstraintKind),
			DCommon.justReturn([constraintLabel("not empty")]),
		)
		.when(
			DDataStructure.constraintIdentifier(DDataStructure.numberInStringConstraintKind),
			DCommon.justReturn([constraintLabel("number in string")]),
		)
		.when(
			DDataStructure.constraintIdentifier(DDataStructure.evenConstraintKind),
			DCommon.justReturn([constraintLabel("even")]),
		)
		.when(
			DDataStructure.constraintIdentifier(DDataStructure.oddConstraintKind),
			DCommon.justReturn([constraintLabel("odd")]),
		)
		.when(
			DDataStructure.constraintIdentifier(DDataStructure.positiveConstraintKind),
			DCommon.justReturn([constraintLabel("positive")]),
		)
		.when(
			DDataStructure.constraintIdentifier(DDataStructure.negativeConstraintKind),
			DCommon.justReturn([constraintLabel("negative")]),
		)
		.when(
			DDataStructure.constraintIdentifier(DDataStructure.notZeroConstraintKind),
			DCommon.justReturn([constraintLabel("not zero")]),
		)
		.when(
			DDataStructure.constraintIdentifier(DDataStructure.safeConstraintKind),
			DCommon.justReturn([constraintLabel("safe number")]),
		)
		.when(
			DDataStructure.constraintIdentifier(DDataStructure.pathConstraintKind),
			DCommon.justReturn([constraintLabel("path")]),
		)
		.when(
			DDataStructure.constraintIdentifier(DDataStructure.absolutePathConstraintKind),
			DCommon.justReturn([constraintLabel("absolute path")]),
		)
		.when(
			DDataStructure.constraintIdentifier(DDataStructure.segmentPathConstraintKind),
			DCommon.justReturn([constraintLabel("path segment")]),
		)
		.when(
			DDataStructure.constraintIdentifier(DServerDataStructure.existConstraintKind),
			DCommon.justReturn([constraintLabel("exists")]),
		)
		.when(
			DDataStructure.constraintIdentifier(DDataStructure.strictPositiveConstraintKind),
			DCommon.justReturn([constraintLabel("> "), literal("0")]),
		)
		.when(
			DDataStructure.constraintIdentifier(DDataStructure.strictNegativeConstraintKind),
			DCommon.justReturn([constraintLabel("< "), literal("0")]),
		)
		.when(
			DDataStructure.constraintIdentifier(DDataStructure.betweenThanConstraintKind),
			({ definition }) => [constraintLabel("> "), literal(String(definition.greater)), secondary(" and "), constraintLabel("< "), literal(String(definition.less))],
		)
		.when(
			DDataStructure.constraintIdentifier(DDataStructure.betweenThanOrEqualConstraintKind),
			({ definition }) => [constraintLabel("range "), literal(`${definition.greater}..${definition.less}`)],
		)
		.when(
			DDataStructure.constraintIdentifier(DDataStructure.multipleOfConstraintKind),
			({ definition }) => [constraintLabel("multiple of "), literal(String(definition.multiple))],
		)
		.when(
			DDataStructure.constraintIdentifier(DDataStructure.regexConstraintKind),
			({ definition }) => [constraintLabel("pattern "), literal(definition.regex.toString())],
		)
		.when(
			DDataStructure.constraintIdentifier(DServerDataStructure.mimeTypeConstraintKind),
			({ definition }) => [constraintLabel("mime "), literal(definition.regex.toString())],
		)
		.when(
			DDataStructure.constraintIdentifier(DServerDataStructure.sizeConstraintKind),
			(constraint) => {
				const { min, max } = constraint.definition;

				if (min && max) {
					return [constraintLabel("size "), literal(`${formatBytes(min)}..${formatBytes(max)}`)];
				}

				if (min) {
					return [constraintLabel("min size "), literal(formatBytes(min))];
				}

				if (max) {
					return [constraintLabel("max size "), literal(formatBytes(max))];
				}

				return null;
			},
		)
		.otherwise(DCommon.justReturn(null));
}

function renderConstraints(
	constraints: readonly DDataStructure.Constraint[],
) {
	return DArray.filter(
		[
			renderStringLength(constraints),
			renderArrayLength(constraints),
			...renderNumberBounds(constraints),
			...DArray.map(constraints, renderSimpleConstraint),
		],
		DCommon.truthy,
	);
}

function renderDataStructure(
	dataStructure: DDataStructure.Structure,
): DataStructureHelp {
	const constraints = renderConstraints(dataStructure.definition.constraints);

	if (DDataStructure.structureIdentifier(dataStructure, DDataStructure.lazyStructureKind)) {
		const inner = renderDataStructure(dataStructure.definition.getter.value);

		return {
			main: inner.main,
			constraints: [...inner.constraints, ...constraints],
		};
	}

	if (DDataStructure.structureIdentifier(dataStructure, DDataStructure.typeStructureKind)) {
		return {
			main: renderType(dataStructure.definition.type),
			constraints,
		};
	}

	if (DDataStructure.structureIdentifier(dataStructure, DDataStructure.arrayStructureKind)) {
		const element = renderDataStructure(dataStructure.definition.element);

		return {
			main: [...element.main, typeLabel("[]")],
			constraints: [
				...DArray.map(element.constraints, (constraint) => [constraintLabel("item "), constraint]),
				...constraints,
			],
		};
	}

	if (DDataStructure.structureIdentifier(dataStructure, DDataStructure.unionStructureKind)) {
		const values = DCommon.pipe(
			dataStructure.definition.values.value,
			DArray.filter((structure) => !DDataStructure.isUndefinedStructure(structure)),
			DArray.map(renderDataStructure),
		);

		if (values.length === 0) {
			return {
				main: [literal("undefined")],
				constraints,
			};
		}

		if (values.length === 1) {
			return {
				main: values[0]!.main,
				constraints: [...values[0]!.constraints, ...constraints],
			};
		}

		return {
			main: DArray.reduce(
				DArray.map(values, ({ main }) => main),
				DArray.reduceFrom<readonly DPrinter.RenderInput[]>([]),
				({ element, index, lastValue, next }) => next([
					...lastValue,
					index === 0 ? null : [secondary(" | ")],
					element,
				]),
			),
			constraints,
		};
	}

	return {
		main: [typeLabel("unknown")],
		constraints,
	};
}

function renderMetadata(
	help: DataStructureHelp,
	markerValue: "required" | "optional",
) {
	return renderInline([
		...help.main,
		secondary(" · "),
		markerValue === "required" ? marker(markerValue) : secondary(markerValue),
	]);
}

function renderConstraintLines(
	constraints: readonly (readonly DPrinter.RenderInput[])[],
	depth: number,
) {
	return DArray.map(
		constraints,
		(constraint) => renderInline([DPrinter.indent(depth), secondary("↳ "), constraint]),
	);
}

function renderDescriptionLine(
	description: string | null,
	depth: number,
) {
	return description
		? renderInline([DPrinter.indent(depth), secondary(description)])
		: null;
}

function renderUsage(command: Command) {
	const args = command.subject?.type === "argument"
		? DArray.map(command.subject.args, (argument) => argument.optional ? `[${argument.name}]` : `<${argument.name}>`)
		: command.subject?.type === "subCommand"
			? ["<command>"]
			: [];

	return DCommon.pipe(
		[command.name, ...args, command.options.length > 0 ? "[options]" : null],
		DArray.filter(DCommon.truthy),
		DString.join(" "),
	);
}

function renderOptionSignature(option: Options) {
	return [
		DArray.map(option.aliases, (alias) => [syntax("-"), name(alias), syntax(", ")]),
		syntax("--"),
		name(option.name),
		simpleOptionKind.has(option) ? syntax(" <value>") : null,
		arrayOptionKind.has(option) ? syntax(" <value...>") : null,
	];
}

function renderOptionDetails(
	option: Options,
	depth: number,
) {
	if (simpleOptionKind.has(option) || arrayOptionKind.has(option)) {
		const help = renderDataStructure(option.dataStructure);

		return DArray.filter(
			[
				renderInline([DPrinter.indent(depth), renderMetadata(help, option.required ? "required" : "optional")]),
				renderDescriptionLine(option.description, depth),
				...renderConstraintLines(help.constraints, depth),
			],
			DCommon.truthy,
		);
	}

	if (booleanOptionKind.has(option)) {
		return DArray.filter(
			[
				renderInline([DPrinter.indent(depth), typeLabel("boolean")]),
				renderDescriptionLine(option.description, depth),
			],
			DCommon.truthy,
		);
	}

	return DArray.filter([renderDescriptionLine(option.description, depth)], DCommon.truthy);
}

export function renderOptionsHelp(
	options: readonly Options[],
	depth: number,
) {
	return DPrinter.renderParagraph([
		renderInline([DPrinter.indent(depth), section("OPTIONS", "magenta")]),
		DArray.map(
			options,
			(option) => DPrinter.renderParagraph([
				renderInline([DPrinter.indent(depth + 1), renderOptionSignature(option)]),
				renderOptionDetails(option, depth + 2),
			]),
		),
	]);
}

export function renderArgumentsHelp(
	args: readonly Argument[],
	depth: number,
) {
	return DPrinter.renderParagraph([
		renderInline([DPrinter.indent(depth), section("ARGUMENTS", "cyan")]),
		DArray.map(
			args,
			(argument) => {
				const help = renderDataStructure(argument.dataStructure);

				return DPrinter.renderParagraph([
					renderInline([
						DPrinter.indent(depth + 1),
						name(argument.name.padEnd(12)),
						renderMetadata(help, argument.optional ? "optional" : "required"),
					]),
					renderDescriptionLine(argument.description, depth + 2),
					renderConstraintLines(help.constraints, depth + 2),
				]);
			},
		),
	]);
}

function renderSubCommandsHelp(
	commands: readonly Command[],
	depth: number,
) {
	return DPrinter.renderParagraph([
		renderInline([DPrinter.indent(depth), section("COMMANDS", "green")]),
		DArray.map(
			commands,
			(command) => renderInline([
				DPrinter.indent(depth + 1),
				name(command.name.padEnd(16)),
				command.description ? secondary(command.description) : null,
			]),
		),
	]);
}

export function renderCommandHelp(
	command: Command,
	depth: number,
) {
	return [
		...DArray.filter(
			[
				renderInline([DPrinter.indent(depth), section("COMMAND", "green"), "  ", DPrinter.colorizedBold(command.name, "cyan")]),
				renderDescriptionLine(command.description, depth + 1),
				DPrinter.renderParagraph([
					renderInline([DPrinter.indent(depth), section("USAGE", "blue")]),
					renderInline([DPrinter.indent(depth + 1), syntax(renderUsage(command))]),
				]),
				command.subject?.type === "argument" ? renderArgumentsHelp(command.subject.args, depth) : null,
				command.subject?.type === "subCommand" ? renderSubCommandsHelp(command.subject.subCommands, depth) : null,
				DArray.minElements(command.options, 1) ? renderOptionsHelp(command.options, depth) : null,
			],
			DCommon.truthy,
		),
	];
}

export function logCommandHelp(
	command: Command,
) {
	// oxlint-disable-next-line no-console
	console.log(
		DPrinter.renderParagraph(
			renderCommandHelp(command, 0),
		),
	);
}

export function renderExecOptionHelp(
	options: readonly Options[],
	depth: number,
) {
	return [
		renderInline([DPrinter.indent(depth), section("EXEC OPTIONS", "green")]),
		renderOptionsHelp(options, depth),
	];
}

export function logExecOptionHelp(
	options: readonly Options[],
) {
	// oxlint-disable-next-line no-console
	console.log(
		DPrinter.renderParagraph(
			renderExecOptionHelp(options, 0),
		),
	);
}
