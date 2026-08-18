import { type TheFile } from "../file";

declare module "@duplojs/lang/dataStructure" {
	interface FundamentalTypesStore {
		serverFile: TheFile;
	}
}
