import { type FixDeepFunctionInfer, type NeverCoalescing } from "@duplojs/utils";
import type * as DDataParser from "@duplojs/utils/dataParser";
import * as dataParsers from "..";

export function file<
	const GenericDefinition extends DDataParser.PrepareDataParserDefinition<
		dataParsers.DataParserDefinitionFile,
		"coerce"
	> = never,
>(
	definition?: FixDeepFunctionInfer<
		DDataParser.PrepareDataParserDefinition<
			dataParsers.DataParserDefinitionFile,
			"coerce"
		>,
		GenericDefinition
	>,
): dataParsers.DataParserFile<
		DDataParser.MergeDefinition<
			dataParsers.DataParserDefinitionFile,
			NeverCoalescing<GenericDefinition, {}> & { coerce: true }
		>
	> {
	return dataParsers.file({
		...definition,
		coerce: true,
	});
}
