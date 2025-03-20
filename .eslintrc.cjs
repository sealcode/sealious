module.exports = {
	env: { node: true },
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint", "prettier", "jsdoc"],
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:@typescript-eslint/recommended-requiring-type-checking",
		"plugin:prettier/recommended",
		// "plugin:jsdoc/recommended",
	],
	parserOptions: {
		sourceType: "module",
		ecmaFeatures: {
			modules: true,
		},
		project: "./tsconfig.json",
	},
	rules: {
		// "jsdoc/require-jsdoc": [
		// "warn",
		// {
		// contexts: ["ClassProperty"],
		// require: {
		// ClassExpression: true,
		// ClassDeclaration: true,
		// MethodDefinition: true,
		// },
		// },
		// ],
		// "jsdoc/require-param-type": 0,
		// "jsdoc/require-param-description": 1,
		"@typescript-eslint/require-await": 0,
		"@typescript-eslint/no-this-alias": 0,
		"@typescript-eslint/no-explicit-any": 1, // maybe we should bring it up to 2 sometime in the future, but so far it seems that this rule has brought more trouble than savings
		"jsdoc/require-description": 2,
		"no-await-in-loop": 2,
	},
	settings: { jsdoc: { mode: "typescript" } },
	overrides: [
		{
			files: ["*.subtest.ts", "*.test.ts"],
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
	],
};
