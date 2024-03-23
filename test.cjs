const mri = require("mri");
const { spawn } = require("child_process");

const argv = process.argv.slice(2);
const args = mri(argv);

const bin_dir = "./node_modules/.bin/";

const mocha = bin_dir + "mocha";

let mocha_options = [
	"--recursive",
	"--timeout=10000",
	"--require",
	"source-map-support/register",
];

if (args["test-report"]) {
	mocha_options = [
		...mocha_options,
		// "--require",
		// "ts-node/register",
		// "--require",
		// "./src/http/type-overrides.ts",
		"--reporter",
		"xunit",
		"--reporter-option",
		"output=.xunit",
	];
}

const mocha_files = ["lib/src/**/*.test.js"];

let command = [mocha, ...mocha_options, ...mocha_files];

if (args.debug) {
	command = ["node", "inspect", ...command];
}

console.log("spawning mocha...", command.join(" "));

const proc = spawn(command[0], command.slice(1), {
	stdio: "inherit",
	env: process.env,
});

proc.on("exit", function (code) {
	if (args["test-report"]) {
		process.exit(0);
	} else {
		process.exit(code);
	}
});
