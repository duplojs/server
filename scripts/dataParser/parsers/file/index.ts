import { type NeverCoalescing, type FixDeepFunctionInfer, detachObjectMethod } from "@duplojs/utils";
import * as DDataParser from "@duplojs/utils/dataParser";
import * as DServerFile from "@scripts/file";
import { createDataParserKind } from "../../kind";

export * from "./checkers";

export type DataParserFileCheckers = DDataParser.GetEligibleChecker<DServerFile.FileInterface>;

export interface DataParserDefinitionFile extends DDataParser.DataParserDefinition<
	DataParserFileCheckers
> {
	readonly coerce: boolean;
}

export const fileKind = createDataParserKind("file");

export class DataParserFile<
	GenericDefinition extends DataParserDefinitionFile = DataParserDefinitionFile,
> extends DDataParser.DataParserBase.init(
		fileKind,
	)<
		GenericDefinition,
		DServerFile.FileInterface,
		DServerFile.FileInterface
	> {
	public get classConstructor() {
		return this.checkConstructor(DataParserFile);
	}

	public declare addChecker: <
		GenericChecker extends readonly [
			DDataParser.DataParserChecker<DDataParser.Output<this>>,
			...DDataParser.DataParserChecker<DDataParser.Output<this>>[],
		],
	>(
		...args: FixDeepFunctionInfer<
			readonly [
				DDataParser.DataParserChecker<DDataParser.Output<this>>,
				...DDataParser.DataParserChecker<DDataParser.Output<this>>[],
			],
			GenericChecker
		>
	) => DataParserFile<
		DDataParser.AddCheckersToDefinition<
			GenericDefinition,
			GenericChecker
		>
	>;

	public static override execParse(
		self: DataParserFile,
		data: unknown,
		error: DDataParser.DataParserError,
	): unknown {
		let fileInterface = data;

		if (self.definition.coerce && typeof fileInterface === "string") {
			fileInterface = DServerFile.createFileInterface(fileInterface);
		}

		if (!DServerFile.isFileInterface(fileInterface)) {
			return DDataParser.addIssue(
				error,
				"file",
				data,
				self.definition.errorMessage,
				self,
			);
		}

		return fileInterface;
	}

	public static override dataParserIsAsynchronous(self: DataParserFile) {
		return false;
	}

	public static override prepareDefinition(
		definition?: Partial<DataParserDefinitionFile>,
	): DataParserDefinitionFile {
		return {
			...definition,
			coerce: definition?.coerce ?? false,
			checkers: definition?.checkers ?? [],
			errorMessage: definition?.errorMessage,
		};
	}

	/**
	 * {@include dataParser/file/index.md}
	 */
	public static override create<
		const GenericDefinition extends DDataParser.PrepareDataParserDefinition<DataParserDefinitionFile> = never,
	>(
		definition?: FixDeepFunctionInfer<
			DDataParser.PrepareDataParserDefinition<DataParserDefinitionFile>,
			GenericDefinition
		>,
	): DataParserFile<
			DDataParser.MergeDefinition<
				DataParserDefinitionFile,
				NeverCoalescing<GenericDefinition, {}>
			>
		> {
		return new DataParserFile(this.prepareDefinition(definition)) as never;
	}
}

export const file = detachObjectMethod(DataParserFile, "create");
