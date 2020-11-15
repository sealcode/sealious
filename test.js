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
	? ["src/setup-test.ts", "./src/**/*.test.ts"]
	: ["lib/src/setup-test.js", "lib/src/**/*.test.js"];

let command = [mocha, ...mocha_options, ...mocha_files];

if (args.cover) {
	command = [bin_dir + "nyc", "--reporter", "clover", ...command];
}

if (args.debug) {
	command = ["node", "debug", ...command];
}

console.log("spawning mocha...");

const proc = spawn(command[0], command.slice(1), { stdio: "inherit" });

proc.on("exit", function (code) {
	process.exit(code);
});
