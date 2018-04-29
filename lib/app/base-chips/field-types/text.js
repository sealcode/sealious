"use strict";
const Promise = require("bluebird");
const escape = require("escape-html");

module.exports = {
	name: "text",
	has_index: function(params) {
		if (params.full_text_search || params.include_in_search) {
			return { original: "text" };
		} else {
			return false;
		}
	},
	get_description: function(context, params) {
		return `Text with maximum length ${params.max_length}`;
	},
	is_proper_value: function(context, params, new_value) {
		let checks = [];

		checks.push(text => {
			if (typeof new_value !== "string") {
				return Promise.reject(
					`Type of ${new_value} is ${typeof new_value}, not string.`
				);
			}
		});
		if (params.min_length) {
			checks.push(text => {
				if (text.length < params.min_length) {
					return Promise.reject(
						`Text '${new_value}' is too short, minimum length is ${
							params.min_length
						} chars.`
					);
				}
			});
		}
		if (params.max_length) {
			checks.push(text => {
				if (text.length > params.max_length) {
					return Promise.reject(
						`Text '${new_value}' has exceeded max length of ${
							params.max_length
						} chars.`
					);
				}
			});
		}
		return Promise.all(checks.map(fn => fn(new_value))).then(() =>
			Promise.resolve()
		);
	},
	encode: function(context, params, value_in_code) {
		if (typeof value_in_code === "string" && value_in_code !== null) {
			const result = {
				original: value_in_code,
				safe: escape(value_in_code),
				valueOf: function() {
					return value_in_code;
				},
			};
			return Promise.resolve(result);
		} else return Promise.resolve(null);
	},
	get_aggregation_stages: function(
		context,
		params,
		field_name,
		field_value_path,
		query_params
	) {
		let filter_value =
			query_params.filter && query_params.filter[field_name];
		if (!filter_value) {
			return [];
		}

		if (filter_value.regex) {
			const regex_options = "i";
			filter_value = {
				$regex: filter_value.regex,
				$options: regex_options,
			};
		}
		return [
			{
				$match: {
					$or: [
						{
							[`${field_value_path}.original`]: filter_value,
						},
						{
							[`${field_value_path}.safe`]: filter_value,
						},
					],
				},
			},
		];
	},
	format: function(context, params, decoded_value, format) {
		if (decoded_value === null || decoded_value === undefined) {
			return Promise.resolve(decoded_value);
		}
		if (format === undefined) {
			return decoded_value.safe;
		}
		return decoded_value[format] ? decoded_value[format] : decoded_value;
	},
};
