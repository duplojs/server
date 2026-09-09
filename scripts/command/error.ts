import * as DCommon from "@duplojs/lang/common";
import * as DPrinter from "@duplojs/lang/printer";
import * as DString from "@duplojs/lang/string";
import * as DModeling from "@duplojs/lang/modeling";
import * as DArray from "@duplojs/lang/array";
import * as DPattern from "@duplojs/lang/pattern";
import * as DDataStructure from "@duplojs/lang/dataStructure";
import { DServerDataStructure } from "@scripts";

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

export function interpretDataStructureError(
	error: DDataStructure.Error,
	dataStructureErrorInterpreter: DDataStructure.ErrorInterpreter,
) {
	return DCommon.pipe(
		dataStructureErrorInterpreter(error),
		DArray.map(
			({ interpretedMessage, path }) => DPrinter.render(
				[
					DPrinter.indent(1),
					"↳ ",
					DPrinter.colorizedBold(path || "<value>", "cyan"),
					" : ",
					DPrinter.colorizedBold(
						interpretedMessage.subSource
							?? interpretedMessage.interpretedSubSource
							?? interpretedMessage.source
							?? interpretedMessage.interpretedSource
							?? "unknown data structure error.",
						"red",
					),
				],
				"",
			),
		),
	);
}

export function interpretErrorIssues(
	issues: readonly Issues[],
	dataStructureErrorInterpreter: DDataStructure.ErrorInterpreter,
) {
	return DPrinter.renderParagraph(
		[
			DArray.map(
				issues,
				DPattern.matchWithTaggedObject({
					DataStructureArgumentIssue: ({ argumentName, dataStructureError }) => [
						DPrinter.render(
							[
								DPrinter.indent(1),
								DPrinter.colorizedBold("ARGUMENT: ", "magenta"),
								`--${argumentName}`,
							],
							"",
						),
						interpretDataStructureError(dataStructureError, dataStructureErrorInterpreter),
					],
					RequiredArgumentIssue: ({ argumentName }) => [
						DPrinter.render(
							[
								DPrinter.indent(1),
								DPrinter.colorizedBold("ARGUMENT: ", "magenta"),
								argumentName,
							],
							"",
						),
						`${DPrinter.indent(1)}↳ Missing Argument`,
					],
					DataStructureOptionIssue: ({ optionName, dataStructureError }) => [
						DPrinter.render(
							[
								DPrinter.indent(1),
								DPrinter.colorizedBold("OPTION: ", "blue"),
								`--${optionName}`,
							],
							"",
						),
						interpretDataStructureError(dataStructureError, dataStructureErrorInterpreter),
					],
					RequiredOptionIssue: ({ optionName }) => [
						DPrinter.render(
							[
								DPrinter.indent(1),
								DPrinter.colorizedBold("OPTION: ", "blue"),
								`--${optionName}`,
							],
							"",
						),
						`${DPrinter.indent(1)}↳ Missing Option`,
					],
					RequiredOptionValueIssue: ({ optionName }) => [
						DPrinter.render(
							[
								DPrinter.indent(1),
								DPrinter.colorizedBold("OPTION: ", "blue"),
								`--${optionName}`,
							],
							"",
						),
						`${DPrinter.indent(1)}↳ Missing Option Value`,
					],
					UnexpectedOptionValueIssue: ({ optionName }) => [
						DPrinter.render(
							[
								DPrinter.indent(1),
								DPrinter.colorizedBold("OPTION: ", "blue"),
								`--${optionName}`,
							],
							"",
						),
						`${DPrinter.indent(1)}↳ Unexpected Value At This Option`,
					],
					TooMuchCommandArgumentIssue: ({ expect, receive }) => [
						`${DPrinter.indent(1)} Too Much Arguments`,
						`${DPrinter.indent(1)} expect: ${expect} receive: ${receive}`,
					],
				}),
			),
			issues.length === 0 && "No issue found",
		],
	);
}

const defaultDataStructureErrorInterpreter = DDataStructure.createErrorInterpreter(
	DServerDataStructure.defaultErrorInterpreterDataStructureDictionary,
	DServerDataStructure.defaultErrorInterpreterCodecDictionary,
);

export function interpretExecCommandError(
	error: Error,
	dataStructureErrorInterpreter?: DDataStructure.ErrorInterpreter,
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
			interpretErrorIssues(error.issues, dataStructureErrorInterpreter ?? defaultDataStructureErrorInterpreter),
		],
	);
}

export function interpretExecOptionsError(
	error: Error,
	dataStructureErrorInterpreter?: DDataStructure.ErrorInterpreter,
): string {
	return DPrinter.renderParagraph(
		[
			DPrinter.colorizedBold("Invalid options", "red"),
			DPrinter.back,
			interpretErrorIssues(error.issues, dataStructureErrorInterpreter ?? defaultDataStructureErrorInterpreter),
		],
	);
}
