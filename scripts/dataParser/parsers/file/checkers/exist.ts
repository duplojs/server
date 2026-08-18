import { callThen, detachObjectMethod, unwrap } from "@duplojs/utils";
import * as DDataParser from "@duplojs/utils/dataParser";
import * as DEither from "@duplojs/utils/either";
import type * as DServerFile from "@scripts/file";
import { createDataParserKind } from "@scripts/dataParser/kind";

export interface DataParserCheckerDefinitionFileExist extends DDataParser.DataParserCheckerDefinition {}

export const checkerFileExistKind = createDataParserKind("checker-file-exist");

export class DataParserCheckerFileExist extends DDataParser.DataParserCheckerBase.init(
	checkerFileExistKind,
)<
		DataParserCheckerDefinitionFileExist,
		DServerFile.FileInterface
	> {
	public get classConstructor() {
		return this.checkConstructor(DataParserCheckerFileExist);
	}

	public isAsynchronous() {
		return true;
	}

	public static override execCheck(
		value: DServerFile.FileInterface,
		error: DDataParser.DataParserError,
		self: DataParserCheckerFileExist,
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

				return value;
			},
		);
	}

	/**
	 * {@include dataParser/file/checkers/exist/index.md}
	 */
	public static override create(
		definition: Partial<DataParserCheckerDefinitionFileExist> = {},
	) {
		return new DataParserCheckerFileExist(definition);
	}
}

export const checkerFileExist = detachObjectMethod(DataParserCheckerFileExist, "create");
