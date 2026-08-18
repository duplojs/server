/* eslint-disable @typescript-eslint/consistent-type-imports */
import { type AnyFunction, createEnum, createGlobalStore, type GetEnumValue, memoPromise } from "@duplojs/utils";

export interface ServerUtilsFunction {}

export const SupportedEnvironment = createEnum(["BUN", "DENO", "NODE", "TEST"]);
export type SupportedEnvironment = GetEnumValue<typeof SupportedEnvironment>;

const SymbolEnvironmentStore = Symbol("environmentStore");
type SymbolEnvironmentStore = typeof SymbolEnvironmentStore;

declare module "@duplojs/utils" {
	interface GlobalStore {
		[SymbolEnvironmentStore]: SupportedEnvironment;
	}
}

const environmentStoreHandler = createGlobalStore(
	SymbolEnvironmentStore,
	(() => {
		if (typeof Deno !== "undefined") {
			return "DENO";
		}
		if (typeof Bun !== "undefined") {
			return "BUN";
		}
		if (typeof process !== "undefined" && process.versions?.node) {
			return "NODE";
		}

		return "NODE";
	})(),
);

/**
 * {@include setEnvironment.md}
 */
export function setEnvironment(environment: SupportedEnvironment) {
	environmentStoreHandler.set(environment);
}

export namespace TESTImplementation {
	const store = new Map<string, AnyFunction>();

	export function clear() {
		store.clear();
	}

	export function set<
		GenericFunctionName extends keyof ServerUtilsFunction,
	>(
		functionName: GenericFunctionName,
		theFunction: ServerUtilsFunction[GenericFunctionName],
	): ServerUtilsFunction[GenericFunctionName] {
		store.set(functionName, theFunction);

		return theFunction;
	}

	export function get<
		GenericFunctionName extends keyof ServerUtilsFunction,
	>(
		functionName: GenericFunctionName,
	): ServerUtilsFunction[GenericFunctionName] | undefined {
		return store.get(functionName);
	}
}

export function implementFunction<
	GenericFunctionName extends keyof ServerUtilsFunction,
>(
	functionName: GenericFunctionName,
	theFunctions: {
		NODE: ServerUtilsFunction[GenericFunctionName];
		BUN?: ServerUtilsFunction[GenericFunctionName];
		DENO?: ServerUtilsFunction[GenericFunctionName];
	},
): ServerUtilsFunction[GenericFunctionName] {
	const environmentFunctions: Record<
		SupportedEnvironment,
		AnyFunction
	> = {
		NODE: theFunctions.NODE,
		BUN: theFunctions.BUN ||= theFunctions.NODE,
		DENO: theFunctions.DENO ||= theFunctions.NODE,
		get TEST() {
			const theFunction = TESTImplementation.get(functionName);

			if (!theFunction) {
				throw new Error(`Missing function implementation "${functionName}" in TEST environment.`);
			}

			return theFunction;
		},
	};

	return (...args: unknown[]) => environmentFunctions[environmentStoreHandler.value](...args);
}

export const nodeFileSystem = memoPromise(() => import("node:fs/promises") as Promise<typeof import("node:fs/promises")>);
export const nodeCrypto = memoPromise(() => import("node:crypto") as Promise<typeof import("node:crypto")>);
export const nodeOs = memoPromise(() => import("node:os") as Promise<typeof import("node:os")>);
