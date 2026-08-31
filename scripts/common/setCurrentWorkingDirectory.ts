import * as DEither from "@duplojs/lang/either";
import type * as DPath from "@duplojs/lang/path";
import { implementFunction } from "@scripts/implementor";

declare module "@scripts/implementor" {
	interface ServerFunction {
		setCurrentWorkingDirectory<
			GenericPath extends string & DPath.Path,
		>(path: GenericPath): DEither.Fail | DEither.Ok;
	}
}

export const setCurrentWorkingDirectory = implementFunction(
	"setCurrentWorkingDirectory",
	{
		NODE: (path) => DEither.whenIsRightOtherwise(
			DEither.safeCallback(() => void process.chdir(path)),
			DEither.ok,
			DEither.fail,
		),
		DENO: (path) => DEither.whenIsRightOtherwise(
			DEither.safeCallback(() => void Deno.chdir(path)),
			DEither.ok,
			DEither.fail,
		),
	},
);
