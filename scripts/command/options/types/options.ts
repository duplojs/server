import { type Option } from "../base";
import { type SimpleOption, type BooleanOption, type ArrayOption } from "../default";

export interface OptionsStore {
	base: Option;
	boolean: BooleanOption;
	simple: SimpleOption;
	array: ArrayOption;
}

export type Options = Extract<
	OptionsStore[keyof OptionsStore],
	Option
>;
