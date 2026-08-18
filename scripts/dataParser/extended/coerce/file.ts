
import type { FixDeepFunctionInfer, NeverCoalescing } from "@duplojs/lang";
import type * as DDataParser from "@duplojs/lang/dataParser";
import type * as dataParsers from "../../parsers";
import * as dataParsersExtended from "..";

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
): dataParsersExtended.DataParserFileExtended<
		DDataParser.MergeDefinition<
			dataParsers.DataParserDefinitionFile,
			NeverCoalescing<GenericDefinition, {}> & { coerce: true }
		>
	> {
	return dataParsersExtended.file({
		...definition,
		coerce: true,
	});
}
