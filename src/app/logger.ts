import chalk from "chalk";
import CH from "color-hash";
const colorHash = new CH();
import { inspect } from "util";

export type LoggerLevel =
	| "debug3"
	| "debug2"
	| "debug"
	| "warn"
	| "error"
	| "info"
	| "none";

const level_order: LoggerLevel[] = [
	"debug3",
	"debug2",
	"debug",
	"warn",
	"error",
	"info",
	"none",
];

type LogFunction = (
	verb: string,
	headline: string,
	data?: any,
	depth?: number | null
) => void;

export default class Logger {
	public debug3: LogFunction;
	public debug2: LogFunction;
	public debug: LogFunction;
	public warn: LogFunction;
	public error: LogFunction;
	public info: LogFunction;

	constructor(public level: LoggerLevel) {
		for (const level of level_order) {
			if (level === "none") {
				continue;
			}
			this[level] = (
				verb: string,
				headline: string,
				data?: any,
				depth?: number | null
			) => this.log(level, verb, headline, data, depth);
		}
	}

	setLevel(level: LoggerLevel) {
		this.level = level;
	}

	private should(log_type: LoggerLevel) {
		return level_order.indexOf(log_type) >= level_order.indexOf(this.level);
	}

	log(
		level: LoggerLevel,
		verb: string,
		headline: string,
		data?: any,
		depth: number | null = 2
	) {
		if (this.should(level)) {
			console.log(
				chalk
					.hex(colorHash.hex(verb.toUpperCase()))
					.inverse(" " + verb.toUpperCase() + " "),
				headline,
				...(data ? [inspect(data, { depth })] : [])
			);
		}
	}
}
