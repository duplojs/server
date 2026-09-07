import type { FileType } from "../file";

declare module "@duplojs/lang/dataStructure" {
	interface TypesStore {
		serverFile: FileType;
	}
}
