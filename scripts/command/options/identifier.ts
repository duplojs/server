import * as DKind from "@duplojs/lang/kind";
import { type Option } from "./base";
import { type Options } from "./types";

export const optionIdentifier = DKind.createKindIdentifier<
	Option,
	Options
>();
