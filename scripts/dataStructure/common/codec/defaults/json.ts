import * as DPath from "@duplojs/lang/path";
import * as DDataStructure from "@duplojs/lang/dataStructure";
import * as DServerFile from "@scripts/file";
import * as FundamentalType from "../../../fundamentalType";

export const codecsJson = DDataStructure.createCodecs({
	...DDataStructure.codecsJson.definition,
	file: DDataStructure.createCodec(
		FundamentalType.TheFile,
		(data) => typeof data === "string" && DPath.is(data),
		(data) => data.path,
		(data) => DServerFile.createFileInterface(data),
	),
});
