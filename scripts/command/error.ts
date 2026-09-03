import * as DPrinter from "@duplojs/lang/printer";
import * as DString from "@duplojs/lang/string";
import * as DModeling from "@duplojs/lang/modeling";
import type * as DDataStructure from "@duplojs/lang/dataStructure";

export interface OptionIssueBase {
	readonly data: unknown;
	readonly path: string;
	readonly optionName: string;
}

export interface RequiredOptionIssue extends OptionIssueBase,
	DModeling.ObjectTag<"RequiredOptionIssue"> {}

export interface RequiredOptionValueIssue extends OptionIssueBase,
	DModeling.ObjectTag<"RequiredOptionValueIssue"> {}

export interface UnexpectedOptionValueIssue extends OptionIssueBase,
	DModeling.ObjectTag<"UnexpectedOptionValueIssue"> {}

export interface DataStructureOptionIssue extends OptionIssueBase,
	DModeling.ObjectTag<"DataStructureOptionIssue"> {
	readonly dataStructureError: DDataStructure.Error;
}

export interface ArgumentIssueBase {
	readonly data: unknown;
	readonly path: string;
	readonly argumentName: string;
}

export interface RequiredArgumentIssue extends ArgumentIssueBase,
	DModeling.ObjectTag<"RequiredArgumentIssue"> {}

export interface DataStructureArgumentIssue extends ArgumentIssueBase,
	DModeling.ObjectTag<"DataStructureArgumentIssue"> {
	readonly dataStructureError: DDataStructure.Error;
}

export interface CommandArgumentIssueBase {
	readonly path: string;
}

export interface TooMuchCommandArgumentIssue extends CommandArgumentIssueBase,
	DModeling.ObjectTag<"TooMuchCommandArgumentIssue"> {
	readonly expect: number;
	readonly receive: number;
}

export type Issues = (
	| RequiredOptionIssue
	| RequiredOptionValueIssue
	| UnexpectedOptionValueIssue
	| DataStructureOptionIssue
	| RequiredArgumentIssue
	| DataStructureArgumentIssue
	| TooMuchCommandArgumentIssue
);

export const SymbolCommandError = Symbol.for("SymbolCommandError");
export type SymbolCommandError = typeof SymbolCommandError;

export interface Error {
	readonly issues: readonly Issues[];
	readonly currentPath: readonly string[];
	pushPath(path: string): void;
	addRequiredOptionIssue(
		optionName: string,
	): SymbolCommandError;
	addRequiredOptionValueIssue(
		optionName: string,
	): SymbolCommandError;
	addUnexpectedOptionValueIssue(
		optionName: string,
		data: unknown,
	): SymbolCommandError;
	addDataStructureOptionIssue(
		optionName: string,
		data: unknown,
		dataStructureError: DDataStructure.Error,
	): SymbolCommandError;
	addRequiredArgumentIssue(
		argumentName: string,
	): SymbolCommandError;
	addDataStructureArgumentIssue(
		argumentName: string,
		data: unknown,
		dataStructureError: DDataStructure.Error,
	): SymbolCommandError;
	addTooMuchCommandArgumentIssue(
		expect: number,
		receive: number,
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
		pushPath: (path) => void currentPath.push(path),
		addRequiredOptionIssue: (
			optionName,
		) => {
			issues.push(
				DModeling.taggedObject(
					"RequiredOptionIssue",
					{
						optionName,
						data: undefined,
						path: currentPath.join("."),
					},
				),
			);

			return SymbolCommandError;
		},
		addRequiredOptionValueIssue: (
			optionName,
		) => {
			issues.push(
				DModeling.taggedObject(
					"RequiredOptionValueIssue",
					{
						optionName,
						data: undefined,
						path: currentPath.join("."),
					},
				),
			);

			return SymbolCommandError;
		},
		addUnexpectedOptionValueIssue: (
			optionName,
			data,
		) => {
			issues.push(
				DModeling.taggedObject(
					"UnexpectedOptionValueIssue",
					{
						optionName,
						data,
						path: currentPath.join("."),
					},
				),
			);

			return SymbolCommandError;
		},
		addDataStructureOptionIssue: (
			optionName,
			data,
			dataStructureError,
		) => {
			issues.push(
				DModeling.taggedObject(
					"DataStructureOptionIssue",
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
		addRequiredArgumentIssue: (
			argumentName,
		) => {
			issues.push(
				DModeling.taggedObject(
					"RequiredArgumentIssue",
					{
						argumentName,
						data: undefined,
						path: currentPath.join("."),
					},
				),
			);

			return SymbolCommandError;
		},
		addDataStructureArgumentIssue: (
			argumentName,
			data,
			dataStructureError,
		) => {
			issues.push(
				DModeling.taggedObject(
					"DataStructureArgumentIssue",
					{
						argumentName,
						data,
						dataStructureError,
						path: currentPath.join("."),
					},
				),
			);

			return SymbolCommandError;
		},
		addTooMuchCommandArgumentIssue: (
			expect,
			receive,
		) => {
			issues.push(
				DModeling.taggedObject(
					"TooMuchCommandArgumentIssue",
					{
						expect,
						receive,
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
					DString.join(error.currentPath, " "),
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
