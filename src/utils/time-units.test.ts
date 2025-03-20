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
				const formatValues = formats[format];
				if (formatValues) {
					const result = time_units(formatValues[0], "h", 1);
					assert.equal(
						result,
						(formatValues[1] / 3600000).toPrecision(8)
					);
				}
			});

			it(`should convert ${format} to minutes`, () => {
				const formatValues = formats[format];
				if (formatValues) {
					const result = time_units(formatValues[0], "m", 1);
					assert.equal(
						result,
						(formatValues[1] / 60000).toPrecision(8)
					);
				}
			});

			it(`should convert ${format} to seconds`, () => {
				const formatValues = formats[format];
				if (formatValues) {
					const result = time_units(formatValues[0], "s", 1);
					assert.equal(
						result,
						(formatValues[1] / 1000).toPrecision(8)
					);
				}
			});

			it(`should convert ${format} to miliseconds`, () => {
				const formatValues = formats[format];
				const result = time_units(formatValues![0], "ms", 1);
				assert.equal(result, (formatValues![1] / 1).toPrecision(8));
			});
		});
	});
});
