"use strict";

const { getDateTime } = require("../../../utils/get-datetime.js");

module.exports = {
	name: "datetime",
	extends: "int",
	has_index: function(params) {
		if (params.indexed) {
			return 1;
		} else return false;
	},
	get_description: function() {
		return "Timestamp - amount of miliseconds since epoch.";
	},
	is_proper_value: function(context, params, datetime) {
		if (Number.isInteger(datetime)) {
			return Promise.resolve();
		}
		return Promise.reject(
			`Value '${datetime}' is not datetime format. Only timestamps are accepted.`
		);
	},
	encode: function(context, params, value_in_code) {
		const parsed_datetime = parseInt(value_in_code);
		return parsed_datetime;
	},
	format: function(context, params, decoded_value, format) {
		if (decoded_value === null || decoded_value === undefined) {
			return Promise.resolve(decoded_value);
		}
		if (format === undefined) {
			return decoded_value;
		}
		if (format === "human_readable") {
			const date = new Date(decoded_value);
			return getDateTime(date);
		}
		return decoded_value[format] ? decoded_value[format] : decoded_value;
	},
};
