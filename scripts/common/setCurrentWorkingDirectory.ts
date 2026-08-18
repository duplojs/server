import { instanceOf, pipe, when } from "@duplojs/lang";
import * as EE from "@duplojs/lang/either";
import * as PP from "@duplojs/lang/pattern";
import { implementFunction } from "@scripts/implementor";

declare module "@scripts/implementor" {
	interface ServerFunction {
		setCurrentWorkingDirectory<
			GenericPath extends string,
		>(path: GenericPath): EE.Fail | EE.Ok;
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
			(path) => EE.safeCallback(() => void process.chdir(path)),
			PP.when(
				EE.isLeft,
				EE.fail,
			),
			PP.otherwise(EE.ok),
		),
		DENO: (path: string) => pipe(
			path,
			when(
				instanceOf(URL),
				({ pathname }) => decodeURIComponent(pathname),
			),
			(path) => EE.safeCallback(() => void Deno.chdir(path)),
			PP.when(
				EE.isLeft,
				EE.fail,
			),
			PP.otherwise(EE.ok),
		),
	},
);
