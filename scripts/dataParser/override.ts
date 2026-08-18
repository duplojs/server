import type { IsExtends } from "@duplojs/utils";
import type * as DServerFile from "@scripts/file";
import type * as AllServerDataParser from "./parsers";
import type * as AllServerDataParserExtended from "./extended/file";

declare module "@duplojs/utils/dataParser" {
	interface DataParserCustom {
		file: AllServerDataParser.DataParserFile;
	}

	interface DataParserExtendedCustom {
		file: AllServerDataParserExtended.DataParserFileExtended;
	}

	interface CheckerCustom {
		fileExist: AllServerDataParser.DataParserCheckerFileExist;
		fileSize: AllServerDataParser.DataParserCheckerFileSize;
		fileMimeType: AllServerDataParser.DataParserCheckerFileMimeType;
	}

	interface EligibleChecker<
		GenericValue extends unknown,
	> {
		file: IsExtends<GenericValue, DServerFile.FileInterface> extends true
			? (
				| AllServerDataParser.DataParserCheckerFileExist
				| AllServerDataParser.DataParserCheckerFileSize
				| AllServerDataParser.DataParserCheckerFileMimeType
			)
			: never;
	}
}
