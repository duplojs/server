import { justReturn, pipe, Printer } from "@duplojs/utils";
import * as AA from "@duplojs/utils/array";
import * as PP from "@duplojs/utils/pattern";
import * as DDP from "@duplojs/utils/dataParser";
import * as SDP from "@scripts/dataParser";
import type { Command } from "./create";
import type { Argument } from "./argument";
import { arrayOptionKind, createBooleanOption, simpleOptionKind, type Options } from "./options";

export const helpOption = createBooleanOption("help", { aliases: ["h"] });

export function formatDataParser(dataParser: DDP.DataParser): string {
	return PP.match(dataParser)
		.when(
			DDP.identifier(DDP.stringKind),
			justReturn("string"),
		)
		.when(
			DDP.identifier(DDP.numberKind),
			justReturn("number"),
		)
		.when(
			DDP.identifier(DDP.bigIntKind),
			justReturn("bigint"),
		)
		.when(
			DDP.identifier(DDP.dateKind),
			justReturn("date"),
		)
		.when(
			DDP.identifier(DDP.timeKind),
			justReturn("time"),
		)
		.when(
			DDP.identifier(DDP.nilKind),
			justReturn("null"),
		)
		.when(
			SDP.fileKind.has,
			justReturn("file"),
		)
		.when(
			DDP.identifier(DDP.literalKind),
			(subject) => pipe(
				subject.definition.value,
				AA.map(String),
				AA.join(" | "),
			),
		)
		.when(
			DDP.identifier(DDP.templateLiteralKind),
			(dataParser) => pipe(
				dataParser.definition.template,
				AA.map(
					(part) => DDP.identifier(part, DDP.dataParserKind)
						? `\${${formatDataParser(part)}}`
						: String(part),
				),
				AA.join(""),
			),
		)
		.when(
			DDP.identifier(DDP.unionKind),
			(dataParser) => pipe(
				dataParser.definition.options,
				AA.map(formatDataParser),
				AA.join(" | "),
			),
		)
		.when(
			DDP.identifier(DDP.transformKind),
			(dataParser) => formatDataParser(dataParser.definition.inner),
		)
		.when(
			DDP.identifier(DDP.pipeKind),
			(dataParser) => formatDataParser(dataParser.definition.input),
		)
		.when(
			DDP.identifier(DDP.optionalKind),
			(dataParser) => `${formatDataParser(dataParser.definition.inner)}?`,
		)
		.when(
			DDP.identifier(DDP.arrayKind),
			(dataParser) => `${formatDataParser(dataParser.definition.element)}[]`,
		)
		.when(
			DDP.identifier(DDP.tupleKind),
			(dataParser) => {
				const parts = pipe(
					dataParser.definition.shape,
					AA.map(formatDataParser),
					AA.join(", "),
				);
				const rest = dataParser.definition.rest
					? `${parts ? ", " : ""}...${formatDataParser(dataParser.definition.rest)}[]`
					: "";

				return `[${parts}${rest}]`;
			},
		)
		.otherwise(justReturn("unknown"));
}

function getOptionMetadata(option: Options) {
	if (
		!simpleOptionKind.has(option)
		&& !arrayOptionKind.has(option)
	) {
		return null;
	}

	const metadata = [`[${formatDataParser(option.dataParser)}]`];

	if (option.required) {
		metadata.push("required");
	}

	return metadata.join(" ");
}

export function renderOptionsHelp(
	options: readonly Options[],
	depth: number,
): string {
	return Printer.renderParagraph([
		`${Printer.indent(depth)}${Printer.colorizedBold("OPTIONS:", "blue")}`,
		AA.map(
			options,
			(option) => {
				const optionMetadata = getOptionMetadata(option);

				return Printer.renderParagraph([
					Printer.renderLine([
						Printer.indent(depth),
						Printer.dash,
						Printer.colorized(`${option.name}:`, "cyan"),
						Printer.colorized(
							pipe(
								option.aliases,
								AA.map((alias) => `-${alias},`),
								AA.push(`--${option.name}`),
								AA.join(" "),
							),
							"gray",
						),
						optionMetadata && Printer.colorized(optionMetadata, "gray"),
					]),
					option.description && `${Printer.indent(depth)}  ${option.description}`,
				]);
			},
		),
	]);
}

export function renderArgumentsHelp(
	args: readonly Argument[],
	depth: number,
): string {
	return Printer.renderParagraph(
		[
			Printer.renderLine([
				Printer.indent(depth),
				Printer.colorizedBold("ARGUMENTS:", "magenta"),
				Printer.colorized(
					pipe(
						args,
						AA.map((argument) => argument.optional ? `<?${argument.name}>` : `<${argument.name}>`),
						AA.join(" "),
					),
					"gray",
				),
			]),
			AA.map(
				args,
				(argument) => Printer.renderParagraph(
					[
						Printer.renderLine([
							Printer.indent(depth),
							Printer.dash,
							Printer.colorized(`${argument.name}:`, "cyan"),
							Printer.colorized(
								argument.optional
									? `${formatDataParser(argument.dataParser)} | undefined`
									: formatDataParser(argument.dataParser),
								"gray",
							),
						]),
						argument.description
						&& `${Printer.indent(depth)}  ${argument.description}`,
					],
				),
			),
		],
	);
}

export function renderCommandHelp(
	command: Command,
	depth: number,
): string[] {
	const logs: string[] = [];

	logs.push(
		`${Printer.indent(depth)}${Printer.colorizedBold("COMMAND:", "green")} ${command.name}`,
	);

	if (command.description) {
		logs.push(
			Printer.renderParagraph(
				[
					`${Printer.indent(depth + 1)}${Printer.colorizedBold("DESCRIPTION:", "cyan")}`,
					`${Printer.indent(depth + 1)}${command.description}`,
				],
			),
		);
	}

	if (AA.minElements(command.options, 1)) {
		logs.push(renderOptionsHelp(command.options, depth + 1));
	}

	if (command.subject?.type === "subCommand") {
		for (const subCommand of command.subject.subCommands) {
			logs.push(...renderCommandHelp(subCommand, depth + 1));
		}
	} else if (command.subject?.type === "argument") {
		logs.push(renderArgumentsHelp(command.subject.args, depth + 1));
	}

	return logs;
}

export function logCommandHelp(
	command: Command,
) {
	// eslint-disable-next-line no-console
	console.log(
		Printer.renderParagraph(
			renderCommandHelp(command, 0),
		),
	);
}

export function renderExecOptionHelp(
	options: readonly Options[],
	depth: number,
): string[] {
	return [
		`${Printer.indent(depth)}${Printer.colorizedBold("OPTION HELP", "green")}`,
		renderOptionsHelp(options, depth + 1),
	];
}

export function logExecOptionHelp(
	options: readonly Options[],
) {
	// eslint-disable-next-line no-console
	console.log(
		Printer.renderParagraph(
			renderExecOptionHelp(options, 0),
		),
	);
}
