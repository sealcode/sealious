import { defineConfig } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import prettier from "eslint-plugin-prettier";
import jsdoc from "eslint-plugin-jsdoc";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

export default defineConfig([
	{
		extends: compat.extends(
			"eslint:recommended",
			"plugin:@typescript-eslint/recommended",
			"plugin:@typescript-eslint/recommended-requiring-type-checking",
			"plugin:prettier/recommended"
		),

		plugins: {
			"@typescript-eslint": typescriptEslint,
			prettier,
			jsdoc,
		},

		languageOptions: {
			globals: {
				...globals.node,
			},

			parser: tsParser,
			ecmaVersion: 5,
			sourceType: "module",

			parserOptions: {
				ecmaFeatures: {
					modules: true,
				},

				project: "./tsconfig.json",
			},
		},

		settings: {
			jsdoc: {
				mode: "typescript",
			},
		},

		rules: {
			"@typescript-eslint/require-await": 0,
			"@typescript-eslint/no-this-alias": 0,
			"@typescript-eslint/no-explicit-any": 1, // maybe we should bring it up to 2 sometime in the future, but so far it seems that this rule has brought more trouble than savings
			"jsdoc/require-description": 2,
			"no-await-in-loop": 2,
		},
	},
	{
		files: ["**/*.subtest.ts", "**/*.test.ts"],

		rules: {
			"@typescript-eslint/no-unsafe-member-access": 0,
			"prefer-const": 0,
			"@typescript-eslint/no-unsafe-call": 0,
			"@typescript-eslint/no-unsafe-return": 0,
			"@typescript-eslint/no-unsafe-assignment": 0,
			"no-await-in-loop": 1, // sometimes it's easier to debug when requests run sequentially
			"@typescript-eslint/no-non-null-assertion": 0,
		},
	},
]);
