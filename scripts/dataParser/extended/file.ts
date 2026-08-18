import { type AnyTuple, detachObjectMethod, type FixDeepFunctionInfer, type NeverCoalescing } from "@duplojs/utils";
import * as DDataParser from "@duplojs/utils/dataParser";
import * as dataParsers from "../parsers";

export class DataParserFileExtended<
	GenericDefinition extends dataParsers.DataParserDefinitionFile = dataParsers.DataParserDefinitionFile,
> extends DDataParser.DataParserBaseExtended.initExtended(dataParsers.DataParserFile)<
		GenericDefinition,
		DDataParser.Output<dataParsers.DataParserFile<GenericDefinition>>,
		DDataParser.Input<dataParsers.DataParserFile<GenericDefinition>>
	> {
	public get classConstructor() {
		return this.checkConstructor(DataParserFileExtended);
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
	) => DataParserFileExtended<
		DDataParser.AddCheckersToDefinition<
			GenericDefinition,
			GenericChecker
		>
	>;

	public declare refine: (
		theFunction: (input: DDataParser.Output<this>) => boolean,
		definition?: Partial<
			Omit<DDataParser.DataParserCheckerDefinitionRefine, "theFunction">
		>,
	) => DataParserFileExtended<
		DDataParser.AddCheckersToDefinition<
			GenericDefinition,
			readonly [DDataParser.CheckerRefineImplementation<DDataParser.Output<this>>]
		>
	>;

	/**
	 * {@include dataParserExtended/file/size/index.md}
	 */
	public size(
		input: dataParsers.DataParserCheckerFileSizeInput,
		definition?: Partial<
			Omit<dataParsers.DataParserCheckerDefinitionFileSize, "min" | "max">
		>,
	): DataParserFileExtended<
			DDataParser.AddCheckersToDefinition<
				GenericDefinition,
				readonly [dataParsers.DataParserCheckerFileSize]
			>
		> {
		return this.addChecker(dataParsers.checkerFileSize(input, definition));
	}

	/**
	 * {@include dataParserExtended/file/exist/index.md}
	 */
	public exist(
		definition?: Partial<dataParsers.DataParserCheckerDefinitionFileExist>,
	): DataParserFileExtended<
			DDataParser.AddCheckersToDefinition<
				GenericDefinition,
				readonly [dataParsers.DataParserCheckerFileExist]
			>
		> {
		return this.addChecker(dataParsers.checkerFileExist(definition));
	}

	/**
	 * {@include dataParserExtended/file/mimeType/index.md}
	 */
	public mimeType(

		/**
		 * {@include dataParserExtended/file/mimeType/parameters/mimeType.md}
		 */
		mimeType: RegExp | string | AnyTuple<string>,
		definition?: Partial<
			Omit<dataParsers.DataParserCheckerDefinitionFileMimeType, "mimeType">
		>,
	): DataParserFileExtended<
			DDataParser.AddCheckersToDefinition<
				GenericDefinition,
				readonly [dataParsers.DataParserCheckerFileMimeType]
			>
		> {
		return this.addChecker(dataParsers.checkerFileMimeType(mimeType, definition));
	}

	/**
	 * {@include dataParserExtended/file/index.md}
	 */
	public static override create<
		const GenericDefinition extends DDataParser.PrepareDataParserDefinition<
			dataParsers.DataParserDefinitionFile
		> = never,
	>(
		definition?: FixDeepFunctionInfer<
			DDataParser.PrepareDataParserDefinition<dataParsers.DataParserDefinitionFile>,
			GenericDefinition
		>,
	): DataParserFileExtended<
			DDataParser.MergeDefinition<
				dataParsers.DataParserDefinitionFile,
				NeverCoalescing<GenericDefinition, {}>
			>
		> {
		return new DataParserFileExtended(this.prepareDefinition(definition)) as never;
	}
}

export const file = detachObjectMethod(DataParserFileExtended, "create");
