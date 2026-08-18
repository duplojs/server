import type * as AllOption from "../";

export interface CustomOption {
	base: AllOption.Option;
}

export type Options = (
	| CustomOption[keyof CustomOption]
	| AllOption.BooleanOption
	| AllOption.SimpleOption
	| AllOption.ArrayOption
);
