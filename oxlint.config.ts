import { defineConfig } from "oxlint";
import { openConfig, testPreset } from "@duplojs/code-config/oxlint";

export default defineConfig({
	extends: [openConfig],
	rules: {
		"typescript/consistent-type-exports": [
			"error",
			{
				fixMixedExportsWithInlineTypeSpecifier: true,
			},
		],
	},
	options: {
		...openConfig.options,
		typeAware: true,
		typeCheck: true,
	},
	overrides: [
		{
			files: [
				"**/*.test.ts",
				"**/*.bench.ts",
				"integrations/**/*.ts",
			],
			excludeFiles: ["**/*.d.ts"],
			rules: {
				...testPreset.rules,
				"typescript/no-confusing-void-expression": "off",
			},
		},
	],
	ignorePatterns: [
		"coverage/**",
		"dist/**",
		".commands/**",
		".agents/**",
		"global.d.ts",
	],
});
