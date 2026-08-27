import { forwardAsserts } from "@duplojs/lang";
import * as DPath from "@duplojs/lang/path";
import * as DEither from "@duplojs/lang/either";
import { implementFunction, nodeCrypto, nodeFileSystem, nodeOs } from "@scripts/implementor";
import type { FileSystemLeft } from "./types";

declare module "@scripts/implementor" {
	interface ServerFunction {
		makeTemporaryFile(
			prefix: string & DPath.Segment,
			suffix?: string & DPath.Segment
		): Promise<FileSystemLeft<"make-temporary-file"> | DEither.Success<string>>;
	}
}

export const makeTemporaryFile = implementFunction(
	"makeTemporaryFile",
	{
		NODE: async(prefix, suffix) => {
			const fs = await nodeFileSystem.value;
			const os = await nodeOs.value;
			const crypto = await nodeCrypto.value;

			const tempPath = forwardAsserts(os.tmpdir(), DPath.is);
			const fileName = forwardAsserts(`${prefix}${crypto.randomUUID()}${suffix ?? ""}`, DPath.isSegment);

			const fileTemporaryPath = DPath.resolveRelative([
				tempPath,
				fileName,
			]);
			return fs.open(fileTemporaryPath, "wx")
				.then((fh) => fh.close())
				.then(() => DEither.success(fileTemporaryPath))
				.catch((value) => DEither.left("file-system-make-temporary-file", value));
		},
		DENO: (prefix, suffix) => Deno.makeTempFile({
			prefix,
			suffix,
		})
			.then(DEither.success)
			.catch((value) => DEither.left("file-system-make-temporary-file", value)),
	},
);
