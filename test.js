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
		"--require",
		"ts-node/register",
		"--reporter",
		"xunit",
		"--reporter-option",
		"output=.xunit",
	];
}

const mocha_files = args["test-report"]
	? ["./src/**/*.test.ts"]
	: ["lib/src/**/*.test.js"];

let command = [mocha, ...mocha_options, ...mocha_files];

if (args.cover) {
	const nyc = [bin_dir + "nyc"];
	if (args["cover-html"]) {
		nyc.push("--reporter", "lcov");
	} else {
		nyc.push("--reporter", "clover");
	}
	command = [...nyc, ...command];
}

if (args.debug) {
	command = ["node", "inspect", ...command];
}

console.log("spawning mocha...");

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
