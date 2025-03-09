import time_units, { type TimeUnit } from "./time-units.js";
import * as assert from "assert";

const formats: { [full_name: string]: [TimeUnit, number] } = {
	hours: ["h", 3600000],
	minutes: ["m", 60000],
	seconds: ["s", 1000],
	miliseconds: ["ms", 1],
};

describe("time-units-function", () => {
	describe("convertion", () => {
		Object.keys(formats).forEach((format: keyof typeof formats) => {
			it(`should convert ${format} to hours`, () => {
				const result = time_units(formats[format][0], "h", 1);
				assert.equal(
					result,
					(formats[format][1] / 3600000).toPrecision(8)
				);
			});

			it(`should convert ${format} to minutes`, () => {
				const result = time_units(formats[format][0], "m", 1);
				assert.equal(
					result,
					(formats[format][1] / 60000).toPrecision(8)
				);
			});

			it(`should convert ${format} to seconds`, () => {
				const result = time_units(formats[format][0], "s", 1);
				assert.equal(
					result,
					(formats[format][1] / 1000).toPrecision(8)
				);
			});

			it(`should convert ${format} to miliseconds`, () => {
				const result = time_units(formats[format][0], "ms", 1);
				assert.equal(result, (formats[format][1] / 1).toPrecision(8));
			});
		});
	});
});
