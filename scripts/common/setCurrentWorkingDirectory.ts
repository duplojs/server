import { instanceOf, pipe, when } from "@duplojs/lang";
import * as DEither from "@duplojs/lang/either";
import * as PP from "@duplojs/lang/pattern";
import { implementFunction } from "@scripts/implementor";

declare module "@scripts/implementor" {
	interface ServerFunction {
		setCurrentWorkingDirectory<
			GenericPath extends string,
		>(path: GenericPath): DEither.Fail | DEither.Ok;
	}
}

export const setCurrentWorkingDirectory = implementFunction(
	"setCurrentWorkingDirectory",
	{
		NODE: (path: string) => pipe(
			path,
			when(
				instanceOf(URL),
				({ pathname }) => decodeURIComponent(pathname),
			),
			(path) => DEither.safeCallback(() => void process.chdir(path)),
			PP.when(
				DEither.isLeft,
				DEither.fail,
			),
			PP.otherwise(DEither.ok),
		),
		DENO: (path: string) => pipe(
			path,
			when(
				instanceOf(URL),
				({ pathname }) => decodeURIComponent(pathname),
			),
			(path) => DEither.safeCallback(() => void Deno.chdir(path)),
			PP.when(
				DEither.isLeft,
				DEither.fail,
			),
			PP.otherwise(DEither.ok),
		),
	},
);
