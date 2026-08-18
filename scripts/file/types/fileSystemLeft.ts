import type * as EE from "@duplojs/utils/either";

export type FileSystemLeft<
	GenericName extends string,
> = EE.Left<`file-system-${GenericName}`, unknown>;
