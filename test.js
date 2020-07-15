const mri = require("mri");
const { spawn } = require("child_process");

const argv = process.argv.slice(2);
const args = mri(argv);

const bin_dir = "./node_modules/.bin/";

const mocha = bin_dir + "mocha";

let mocha_options = [
	"--require",
	"ts-node/register",
	"--require",
	"source-map-support/register",
	"--recursive",
	"--timeout=10000",
];

if (args["test-report"]) {
	mocha_options = [
		...mocha_options,
		"--reporter",
		"xunit",
		"--reporter-option",
		"output=.xunit",
	];
}

const mocha_files = ["setup-test.ts", "./src/**/*.test.ts"];

let command = [mocha, ...mocha_options, ...mocha_files];

if (args.cover) {
	command = [bin_dir + "nyc", "--reporter", "clover", ...command];
}

if (args.debug) {
	command = ["node", "debug", ...command];
}

console.log("spawning", command);

const proc = spawn(command[0], command.slice(1), { stdio: "inherit" });

proc.on("exit", function (code) {
	process.exit(code);
});
