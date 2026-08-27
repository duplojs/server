import type * as DEither from "@duplojs/lang/either";

export type FileSystemLeft<
	GenericName extends string,
> = DEither.Left<`file-system-${GenericName}`, unknown>;
