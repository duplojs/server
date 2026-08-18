import { instanceOf, pipe, when } from "@duplojs/utils";
import * as EE from "@duplojs/utils/either";
import * as PP from "@duplojs/utils/pattern";
import { implementFunction } from "@scripts/implementor";

declare module "@scripts/implementor" {
	interface ServerUtilsFunction {
		setCurrentWorkingDirectory<
			GenericPath extends string,
		>(path: GenericPath): EE.Fail | EE.Ok;
	}
}

/**
 * {@include common/setCurrentWorkingDirectory/index.md}
 */
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
