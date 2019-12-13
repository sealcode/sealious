"use strict";
const locreq = require("locreq")(__dirname);
const Errors = locreq("lib/response/error.js");

const human_comparators_to_query = {
	">": "$gt",
	gt: "$gt",
	gte: "$gte",
	">=": "$gte",
	"=>": "$gte",
	"<": "$lt",
	lt: "$lt",
	lte: "$lte",
	"<=": "$lte",
	"=<": "$lte",
	"=": "$eq",
};

const proper_value_checkers = [
	(params, value) => {
		if (Number.isFinite(params.min) && value < params.min)
			return [
				false,
				`Value should be larger or equal to '${params.min}'.`,
			];
		else return [true];
	},
	(params, value) => {
		if (Number.isFinite(params.max) && value > params.max)
			return [
				false,
				`Value should be smaller or equal to '${params.max}'.`,
			];
		else return [true];
	},
];

const int = {
	name: "int",
	get_description: () => "An integer number.",
	is_proper_value: function(context, params, new_value) {
		const number = parseInt(new_value, 10);

		if (
			number.toString() !== new_value.toString().trim() ||
			number === null ||
			isNaN(number)
		) {
			return Promise.reject(
				`Value '${new_value}' is not a int number format.`
			);
		}
		
		const failed_checks = proper_value_checkers
			.map(fn => fn(params, new_value))
			.filter(element => !element[0]);

		if (!failed_checks.length) {
			return Promise.resolve();
		}
		return Promise.reject(failed_checks.map(e => e[1]).join(" "));
	},
	encode: (context, params, value_in_code) => parseInt(value_in_code, 10),
	filter_to_query: function(context, params, field_filter) {
		if (typeof field_filter !== "object") {
			return {
				$eq: parseInt(field_filter, 10),
			};
		}
		// treating filter as a query here
		const new_filter = {};
		for (const comparator in field_filter) {
			const new_comparator = human_comparators_to_query[comparator];
			if (new_comparator === undefined) {
				throw new Errors.ValidationError(
					`Unknown comparator: '${comparator}'.`
				);
			}
			new_filter[new_comparator] = parseInt(field_filter[comparator], 10);
		}
		return new_filter;
	},
};

module.exports = int;
