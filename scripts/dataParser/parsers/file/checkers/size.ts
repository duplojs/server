import { type BytesInString, callThen, detachObjectMethod, stringToBytes, unwrap } from "@duplojs/utils";
import * as DDataParser from "@duplojs/utils/dataParser";
import * as DEither from "@duplojs/utils/either";
import type * as DServerFile from "@scripts/file";
import { createDataParserKind } from "@scripts/dataParser/kind";

export interface DataParserCheckerDefinitionFileSize extends DDataParser.DataParserCheckerDefinition {
	min?: number;
	max?: number;
}

export interface DataParserCheckerFileSizeInput {

	/**
	 * {@include dataParser/file/checkers/size/properties/min.md}
	 */
	min?: number | BytesInString;

	/**
	 * {@include dataParser/file/checkers/size/properties/max.md}
	 */
	max?: number | BytesInString;
}

export const checkerFileSizeKind = createDataParserKind("checker-file-size");

export class DataParserCheckerFileSize extends DDataParser.DataParserCheckerBase.init(
	checkerFileSizeKind,
)<
		DataParserCheckerDefinitionFileSize,
		DServerFile.FileInterface
	> {
	public get classConstructor() {
		return this.checkConstructor(DataParserCheckerFileSize);
	}

	public isAsynchronous() {
		return true;
	}

	public static override execCheck(
		value: DServerFile.FileInterface,
		error: DDataParser.DataParserError,
		self: DataParserCheckerFileSize,
		dataParser: DDataParser.DataParser,
	): unknown {
		return callThen(
			value.stat(),
			(fileStatResult) => {
				if (DEither.isLeft(fileStatResult)) {
					return DDataParser.addIssue(
						error,
						"existing file",
						value,
						self.definition.errorMessage ?? dataParser.definition.errorMessage,
						self,
					);
				}

				const fileStat = unwrap(fileStatResult);

				if (!fileStat.isFile) {
					return DDataParser.addIssue(
						error,
						"file",
						value,
						self.definition.errorMessage ?? dataParser.definition.errorMessage,
						self,
					);
				}

				if (
					self.definition.max !== undefined
					&& fileStat.sizeBytes > self.definition.max
				) {
					return DDataParser.addIssue(
						error,
						`file with sizeBytes <= ${self.definition.max}`,
						fileStat.sizeBytes,
						self.definition.errorMessage ?? dataParser.definition.errorMessage,
						self,
					);
				}

				if (
					self.definition.min !== undefined
					&& fileStat.sizeBytes < self.definition.min
				) {
					return DDataParser.addIssue(
						error,
						`file with sizeBytes >= ${self.definition.min}`,
						fileStat.sizeBytes,
						self.definition.errorMessage ?? dataParser.definition.errorMessage,
						self,
					);
				}

				return value;
			},
		);
	}

	/**
	 * {@include dataParser/file/checkers/size/index.md}
	 */
	public static override create(
		input: DataParserCheckerFileSizeInput,
		definition: Partial<
			Omit<DataParserCheckerDefinitionFileSize, "min" | "max">
		> = {},
	) {
		return new DataParserCheckerFileSize({
			...definition,
			min: input.min && stringToBytes(input.min),
			max: input.max && stringToBytes(input.max),
		});
	}
}

export const checkerFileSize = detachObjectMethod(DataParserCheckerFileSize, "create");
