import { Printer } from "@duplojs/utils";
import type * as DDP from "@duplojs/utils/dataParser";

export interface CommandErrorIssue {
	readonly type: "argument" | "command" | "option";
	readonly commandPath: readonly string[];
	readonly target?: string;
	readonly parserPath?: string;
	readonly expected: string;
	readonly received: unknown;
	readonly message?: string;
}

export interface CommandError {
	readonly issues: CommandErrorIssue[];
	readonly currentCommandPath: string[];
}

export const SymbolCommandError = Symbol.for("SymbolCommandError");
export type SymbolCommandError = typeof SymbolCommandError;

export function createError(
	commandName: string,
): CommandError {
	return {
		issues: [],
		currentCommandPath: [commandName],
	};
}

export function addIssue(
	error: CommandError,
	issue: Omit<CommandErrorIssue, "commandPath">,
): SymbolCommandError {
	error.issues.push(
		{
			...issue,
			commandPath: [...error.currentCommandPath],
		},
	);

	return SymbolCommandError;
}

export function addIssueDataParser(
	error: CommandError,
	parseError: DDP.DataParserError,
	params: {
		type: "argument" | "option";
		target?: string;
	},
): SymbolCommandError {
	for (const issue of parseError.issues) {
		error.issues.push(
			{
				type: params.type,
				commandPath: [...error.currentCommandPath],
				target: params.target,
				parserPath: issue.path || undefined,
				expected: issue.expected,
				received: issue.data,
				message: issue.message,
			},
		);
	}

	return SymbolCommandError;
}

export function interpretCommandError(
	error: CommandError,
): string {
	return Printer.renderParagraph(
		[
			Printer.render(
				[
					Printer.colorizedBold("Command failed", "red"),
					Printer.back,
					Printer.indent(1),
					Printer.colorizedBold("COMMAND: ", "cyan"),
					error.issues[0]?.commandPath.join(" ") ?? error.currentCommandPath.join(" "),
				],
				"",
			),
			error.issues.map(
				(issue) => Printer.renderParagraph(
					[
						issue.type === "option"
						&& issue.target
						&& Printer.render(
							[
								Printer.indent(1),
								Printer.colorizedBold("OPTION: ", "blue"),
								`--${issue.target}`,
							],
							"",
						),
						issue.type === "argument"
						&& issue.target
						&& Printer.render(
							[
								Printer.indent(1),
								Printer.colorizedBold("ARGUMENT: ", "magenta"),
								issue.target,
							],
							"",
						),
						Printer.renderLine(
							[
								Printer.colorizedBold("✖", "red"),
								issue.parserPath && Printer.colorizedBold(issue.parserPath, "cyan"),
								"expected",
								Printer.colorized(issue.expected, "green"),
								"but received",
								Printer.colorized(Printer.stringify(issue.received), "red"),
							],
						),
						issue.message !== undefined && `${Printer.indent(1)}↳ ${issue.message}`,
					],
				),
			),
			error.issues.length === 0 && "No issue found",
		],
	);
}

export function interpretExecOptionError(
	error: CommandError,
): string {
	return Printer.renderParagraph(
		[
			Printer.colorizedBold("Invalid options", "red"),
			error.issues.map(
				(issue) => Printer.renderParagraph(
					[
						issue.type === "option"
						&& issue.target
						&& Printer.render(
							[
								Printer.indent(1),
								Printer.colorizedBold("OPTION: ", "blue"),
								`--${issue.target}`,
							],
							"",
						),
						Printer.renderLine(
							[
								Printer.colorizedBold("✖", "red"),
								issue.parserPath && Printer.colorizedBold(issue.parserPath, "cyan"),
								"expected",
								Printer.colorized(issue.expected, "green"),
								"but received",
								Printer.colorized(Printer.stringify(issue.received), "red"),
							],
						),
						issue.message !== undefined && `${Printer.indent(1)}↳ ${issue.message}`,
					],
				),
			),
			error.issues.length === 0 && "No issue found",
		],
	);
}
