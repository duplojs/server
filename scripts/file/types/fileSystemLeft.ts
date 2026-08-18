import type * as EE from "@duplojs/lang/either";

export type FileSystemLeft<
	GenericName extends string,
> = EE.Left<`file-system-${GenericName}`, unknown>;
