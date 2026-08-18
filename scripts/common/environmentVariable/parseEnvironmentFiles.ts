import { innerPipe, pipe, when } from "@duplojs/utils";
import * as GG from "@duplojs/utils/generator";
import * as SS from "@duplojs/utils/string";
import * as EE from "@duplojs/utils/either";
import * as SF from "@scripts/file";

const lineRegex = /^(?:export\s+)?(?<key>[A-Z_][A-Z0-9_]*)=(?<value>'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|`(?:\\`|[^`])*`|[^\s#\r\n][^#\r\n]*|)\s*(?:#.*)?$/mg;
const endLineBreakerRegex = /\r\n?/mg;
const surroundingQuoteRegex = /^(['"`])([\s\S]*)\1$/mg;
const backCartRegex = /\\r/g;
const newLineRegex = /\\n/g;

export function parseEnvironmentLine(line: string) {
	return pipe(
		line,
		SS.replace(endLineBreakerRegex, "\n"),
		SS.extractAll(lineRegex),
		GG.reduce(
			GG.reduceFrom<Record<string, string>>({}),
			({ element, nextWithObject, lastValue, next }) => {
				if (element.namedGroups?.key && element.namedGroups?.value) {
					return nextWithObject(
						lastValue,
						{
							[element.namedGroups.key]: pipe(
								element.namedGroups.value,
								(value) => {
									const surroundingValue = SS.replace(value, surroundingQuoteRegex, "$2");

									if (SS.startsWith(value, "\"")) {
										return pipe(
											surroundingValue,
											SS.replace(newLineRegex, "\n"),
											SS.replace(backCartRegex, "\r"),
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
	paths: string[],
) {
	return GG.asyncReduce(
		paths,
		GG.reduceFrom<Record<string, string>[]>([baseEnv]),
		({ lastValue, element, nextPush, exit }) => SF
			.readTextFile(element)
			.then(
				innerPipe(
					EE.whenIsRight(
						innerPipe(
							parseEnvironmentLine,
							(value) => nextPush(lastValue, value),
						),
					),
					when(
						EE.isLeft,
						exit,
					),
				),
			),
	);
}
