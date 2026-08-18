import { SizeConstraint, type SizeConstraintParams } from "../constraint";

export function size(params: SizeConstraintParams) {
	return SizeConstraint(params);
}
