module.exports = {
	extends: ["eslint:recommended", "prettier", "plugin:react/recommended"],
	plugins: ["prettier", "react"],
	rules: {
		"prettier/prettier": [
			"error",
			{
				tabWidth: 4,
				trailingComma: "es5",
				useTabs: true,
			},
		],
		"no-console": 0,
	},
	env: {
		node: true,
		mocha: true,
		browser: true,
	},
	parserOptions: {
		ecmaVersion: 2017,
		sourceType: "module",
		ecmaFeatures: {
			experimentalObjectRestSpread: true,
		},
	},
	globals: {
		TEST_CONFIG: false,
		Promise: false,
		Assert: false,
		Map: false,
	},
};
