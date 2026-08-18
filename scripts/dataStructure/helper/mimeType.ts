import { MimeTypeConstraint } from "../constraint";

export function mimeType(mimeType: Parameters<typeof MimeTypeConstraint>[0]) {
	return MimeTypeConstraint(mimeType);
}
