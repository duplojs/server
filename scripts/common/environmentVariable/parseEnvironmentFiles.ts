import * as DCommon from "@duplojs/lang/common";
import type * as DPath from "@duplojs/lang/path";
import * as DGenerator from "@duplojs/lang/generator";
import * as DString from "@duplojs/lang/string";
import * as DEither from "@duplojs/lang/either";
import * as DServerFile from "@scripts/file";

const lineRegex = /^(?:export\s+)?(?<key>[A-Z_][A-Z0-9_]*)=(?<value>'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|`(?:\\`|[^`])*`|[^\s#\r\n][^#\r\n]*|)\s*(?:#.*)?$/mg;
const endLineBreakerRegex = /\r\n?/mg;
const surroundingQuoteRegex = /^(['"`])([\s\S]*)\1$/mg;
const backCartRegex = /\\r/g;
const newLineRegex = /\\n/g;

export function parseEnvironmentLine(line: string) {
	return DCommon.pipe(
		line,
		DString.replace(endLineBreakerRegex, "\n"),
		DString.extractAll(lineRegex),
		DGenerator.reduce(
			DGenerator.reduceFrom<Record<string, string>>({}),
			({ item, nextWithObject, lastValue, next }) => {
				if (item.namedGroups?.key && item.namedGroups?.value) {
					return nextWithObject(
						lastValue,
						{
							[item.namedGroups.key]: DCommon.pipe(
								item.namedGroups.value,
								(value) => {
									const surroundingValue = DString.replace(value, surroundingQuoteRegex, "$2");

									if (DString.startsWith(value, "\"")) {
										return DCommon.pipe(
											surroundingValue,
											DString.replace(newLineRegex, "\n"),
											DString.replace(backCartRegex, "\r"),
										);
									}

									return surroundingValue;
								},
							),
						},
					);
				}
				return next(lastValue);
			},
		),
	);
}

export function parseEnvironmentFiles(
	baseEnv: Record<string, string>,
	paths: (string & DPath.Path)[],
) {
	return DGenerator.asyncReduce(
		paths,
		DGenerator.reduceFrom<Record<string, string>[]>([baseEnv]),
		({ lastValue, item, nextPush, exit }) => DServerFile
			.readTextFile(item)
			.then(
				DCommon.innerPipe(
					DEither.whenIsRight(
						DCommon.innerPipe(
							parseEnvironmentLine,
							(value) => nextPush(lastValue, value),
						),
					),
					DCommon.when(
						DEither.isLeft,
						exit,
					),
				),
			),
	);
}
