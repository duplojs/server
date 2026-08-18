import { type AnyTuple, detachObjectMethod, toRegExp } from "@duplojs/utils";
import * as DDataParser from "@duplojs/utils/dataParser";
import type * as DServerFile from "@scripts/file";
import { createDataParserKind } from "@scripts/dataParser/kind";

export interface DataParserCheckerDefinitionFileMimeType extends DDataParser.DataParserCheckerDefinition {
	mimeType: RegExp;
}

export const checkerFileMimeTypeKind = createDataParserKind("checker-file-mime-type");

export class DataParserCheckerFileMimeType extends DDataParser.DataParserCheckerBase.init(
	checkerFileMimeTypeKind,
)<
		DataParserCheckerDefinitionFileMimeType,
		DServerFile.FileInterface
	> {
	public get classConstructor() {
		return this.checkConstructor(DataParserCheckerFileMimeType);
	}

	public isAsynchronous() {
		return false;
	}

	public static override execCheck(
		value: DServerFile.FileInterface,
		error: DDataParser.DataParserError,
		self: DataParserCheckerFileMimeType,
		dataParser: DDataParser.DataParser,
	): unknown {
		if (
			self.definition.mimeType
			&& !self
				.definition
				.mimeType
				.test(value.getMimeType() ?? "")
		) {
			return DDataParser.addIssue(
				error,
				`file with mime type matching ${self.definition.mimeType.source}`,
				value,
				self.definition.errorMessage ?? dataParser.definition.errorMessage,
				self,
			);
		}

		return value;
	}

	/**
	 * {@include dataParser/file/checkers/mimeType/index.md}
	 */
	public static override create(

		/**
		 * {@include dataParser/file/checkers/mimeType/parameters/mimeType.md}
		 */
		mimeType: RegExp | string | AnyTuple<string>,
		definition: Partial<
			Omit<DataParserCheckerDefinitionFileMimeType, "mimeType">
		> = {},
	) {
		return new DataParserCheckerFileMimeType({
			...definition,
			mimeType: toRegExp(mimeType),
		});
	}
}

export const checkerFileMimeType = detachObjectMethod(DataParserCheckerFileMimeType, "create");
