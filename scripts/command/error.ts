import * as DPrinter from "@duplojs/lang/printer";
import * as DString from "@duplojs/lang/string";
import * as DModeling from "@duplojs/lang/modeling";
import type * as DDataStructure from "@duplojs/lang/dataStructure";

export interface OptionCommandIssueBase {
	readonly data: unknown;
	readonly path: string;
	readonly optionName: string;
}

export interface RequiredOptionCommandIssue extends OptionCommandIssueBase,
	DModeling.ObjectTag<"RequiredOptionCommandIssue"> {}

export interface RequiredOptionValueCommandIssue extends OptionCommandIssueBase,
	DModeling.ObjectTag<"RequiredOptionValueCommandIssue"> {}

export interface UnexpectedOptionValueCommandIssue extends OptionCommandIssueBase,
	DModeling.ObjectTag<"UnexpectedOptionValueCommandIssue"> {}

export interface DataStructureOptionCommandIssue extends OptionCommandIssueBase,
	DModeling.ObjectTag<"DataStructureOptionCommandIssue"> {
	readonly dataStructureError: DDataStructure.Error;
}

export type Issues = (
	| RequiredOptionCommandIssue
	| RequiredOptionValueCommandIssue
	| UnexpectedOptionValueCommandIssue
	| DataStructureOptionCommandIssue
);

export const SymbolCommandError = Symbol.for("SymbolCommandError");
export type SymbolCommandError = typeof SymbolCommandError;

export interface Error {
	readonly issues: readonly Issues[];
	readonly currentPath: readonly string[];
	addRequiredOptionCommandIssue(
		optionName: string,
		data: unknown,
	): SymbolCommandError;
	addRequiredOptionValueCommandIssue(
		optionName: string,
	): SymbolCommandError;
	addUnexpectedOptionValueCommandIssue(
		optionName: string,
		data: unknown,
	): SymbolCommandError;
	addDataStructureOptionCommandIssue(
		optionName: string,
		data: unknown,
		dataStructureError: DDataStructure.Error,
	): SymbolCommandError;
}

export function createError(
	commandName: string,
): Error {
	const issues: Issues[] = [];
	const currentPath = [commandName];

	return {
		issues,
		currentPath,
		addRequiredOptionCommandIssue: (
			optionName,
			data,
		) => {
			issues.push(
				DModeling.taggedObject(
					"RequiredOptionCommandIssue",
					{
						optionName,
						data,
						path: currentPath.join("."),
					},
				),
			);

			return SymbolCommandError;
		},
		addRequiredOptionValueCommandIssue: (
			optionName,
		) => {
			issues.push(
				DModeling.taggedObject(
					"RequiredOptionValueCommandIssue",
					{
						optionName,
						data: undefined,
						path: currentPath.join("."),
					},
				),
			);

			return SymbolCommandError;
		},
		addUnexpectedOptionValueCommandIssue: (
			optionName,
			data,
		) => {
			issues.push(
				DModeling.taggedObject(
					"UnexpectedOptionValueCommandIssue",
					{
						optionName,
						data,
						path: currentPath.join("."),
					},
				),
			);

			return SymbolCommandError;
		},
		addDataStructureOptionCommandIssue: (
			optionName,
			data,
			dataStructureError,
		) => {
			issues.push(
				DModeling.taggedObject(
					"DataStructureOptionCommandIssue",
					{
						optionName,
						data,
						dataStructureError,
						path: currentPath.join("."),
					},
				),
			);

			return SymbolCommandError;
		},
	};
}

export function interpretCommandError(
	error: Error,
): string {
	return DPrinter.renderParagraph(
		[
			DPrinter.render(
				[
					DPrinter.colorizedBold("Command failed", "red"),
					DPrinter.back,
					DPrinter.indent(1),
					DPrinter.colorizedBold("COMMAND: ", "cyan"),
					error.issues[0]?.commandPath.join(" ") ?? error.currentPath.join(" "),
				],
				"",
			),
			error.issues.map(
				(issue) => DPrinter.renderParagraph(
					[
						issue.type === "option"
						&& issue.target
						&& DPrinter.render(
							[
								DPrinter.indent(1),
								DPrinter.colorizedBold("OPTION: ", "blue"),
								`--${issue.target}`,
							],
							"",
						),
						issue.type === "argument"
						&& issue.target
						&& DPrinter.render(
							[
								DPrinter.indent(1),
								DPrinter.colorizedBold("ARGUMENT: ", "magenta"),
								issue.target,
							],
							"",
						),
						DPrinter.renderLine(
							[
								DPrinter.colorizedBold("✖", "red"),
								issue.parserPath && DPrinter.colorizedBold(issue.parserPath, "cyan"),
								"expected",
								DPrinter.colorized(issue.expected, "green"),
								"but received",
								DPrinter.colorized(DString.stringify(issue.received), "red"),
							],
						),
						issue.message !== undefined && `${DPrinter.indent(1)}↳ ${issue.message}`,
					],
				),
			),
			error.issues.length === 0 && "No issue found",
		],
	);
}

export function interpretExecOptionError(
	error: Error,
): string {
	return DPrinter.renderParagraph(
		[
			DPrinter.colorizedBold("Invalid options", "red"),
			error.issues.map(
				(issue) => DPrinter.renderParagraph(
					[
						issue.type === "option"
						&& issue.target
						&& DPrinter.render(
							[
								DPrinter.indent(1),
								DPrinter.colorizedBold("OPTION: ", "blue"),
								`--${issue.target}`,
							],
							"",
						),
						DPrinter.renderLine(
							[
								DPrinter.colorizedBold("✖", "red"),
								issue.parserPath && DPrinter.colorizedBold(issue.parserPath, "cyan"),
								"expected",
								DPrinter.colorized(issue.expected, "green"),
								"but received",
								DPrinter.colorized(DString.stringify(issue.received), "red"),
							],
						),
						issue.message !== undefined && `${DPrinter.indent(1)}↳ ${issue.message}`,
					],
				),
			),
			error.issues.length === 0 && "No issue found",
		],
	);
}
