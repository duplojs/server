import { type FileType } from "../time";

declare module "@duplojs/lang/dataStructure" {
	interface TypesStore {
		serverFile: FileType;
	}
}
