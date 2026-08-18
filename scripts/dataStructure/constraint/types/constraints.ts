import { type ExistConstraint } from "../exist";
import { type MimeTypeConstraint } from "../mimeType";
import { type SizeConstraint } from "../size";

declare module "@duplojs/lang/dataStructure" {
	interface ConstraintsStore {
		exist: ExistConstraint;
		size: SizeConstraint;
		mimeType: MimeTypeConstraint;
	}
}
