import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		watch: false,
		globals: true,
		include: [
			"tests/**/*.test.ts",
			"integrations/**/*.test.ts",
		],
		coverage: {
			provider: "istanbul",
			reporter: ["text", "json", "html", "json-summary"],
			reportsDirectory: "coverage",
			include: ["scripts/**/*.ts"],
			exclude: [
				"**/*.test.ts",
				"bin",
				"dist",
			],
			thresholds: {
				lines: 100,
				branches: 100,
				functions: 100,
				statements: 100,
			},
		},
		benchmark: {
			include: [
				"tests/**/*.bench.ts",
				"integrations/**/*.bench.ts",
			],
		},
		typecheck: {
			enabled: true,
			tsconfig: "./tsconfig.test.json",
			include: ["tests/**/*.test-d.ts"],
			ignoreSourceErrors: true,
		},
	},
	resolve: {
		tsconfigPaths: true,
	},
});
