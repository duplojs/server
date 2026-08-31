import * as DGenerator from "@duplojs/lang/generator";
import * as DObject from "@duplojs/lang/object";
import * as DString from "@duplojs/lang/string";

const envVarRegex = /(?<!\\)\${(?<value>[^{}]+)}/g;
const escapedDollarRegex = /\\\$/g;

export function expandValue(
	value: string,
	env: Record<string, string>,
	stack = new Set<string>(),
): string {
	return DString.replace(
		value,
		envVarRegex,
		({ namedGroups }) => {
			const value = namedGroups!.value!;

			const rawEnvValue = env[value];

			if (rawEnvValue === undefined || stack.has(value)) {
				return "";
			}

			stack.add(value);

			const resolved = expandValue(rawEnvValue, env, stack);

			stack.delete(value);

			return resolved;
		},
	);
}

export function expandEnvironmentVariables(env: Record<string, string>) {
	return DGenerator.reduce(
		DObject.entries(env),
		DGenerator.reduceFrom<Record<string, string>>(env),
		({ item: [key, value], lastValue, nextWithObject }) => nextWithObject(
			lastValue,
			{
				[key]: DString.replaceAll(
					expandValue(value, lastValue),
					escapedDollarRegex,
					"$",
				),
			},
		),
	);
}
