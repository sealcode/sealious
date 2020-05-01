const Errors = require("../../../response/error.js");
const human_comparators_to_query = {
	">": "$gt",
	from: "$gte",
	gt: "$gt",
	gte: "$gte",
	">=": "$gte",
	"=>": "$gte",
	"<": "$lt",
	to: "$lte",
	lt: "$lt",
	lte: "$lte",
	"<=": "$lte",
	"=<": "$lte",
	"=": "$eq",
};

const DAY = 1000 * 60 * 60 * 24;

function dateStrToDayInt(date_str) {
	return Date.parse(date_str) / DAY;
}

module.exports = {
	name: "date",
	get_description: function () {
		return "Date standard ISO 8601 (YYYY-MM-DD)";
	},
	is_proper_value: function (context, params, date) {
		const date_in_string = date.toString();

		const regex = /^([0-9]{4})-(0?[1-9]|1[0-2])-([0-2]?[0-9]|30|31)$/; // granulation_per_day

		if (
			regex.test(date_in_string) === false ||
			isNaN(Date.parse(date_in_string))
		) {
			return Promise.reject(
				`Value "${date}" is not date calendar format. Expected value in standard IS0 8601 (YYYY-MM-DD) format`
			);
		} else {
			return Promise.resolve();
		}
	},
	encode: function (_, __, value_in_code) {
		const date_str = value_in_code.toString();
		// value is already confirmed to be properly formatted
		return dateStrToDayInt(date_str);
	},
	filter_to_query: function (_, __, field_filter) {
		if (typeof field_filter !== "object") {
			return {
				$eq: dateStrToDayInt(field_filter),
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
			new_filter[new_comparator] = dateStrToDayInt(
				field_filter[comparator]
			);
		}
		return new_filter;
	},
	decode: function (_, __, value_in_db) {
		const d = new Date(value_in_db * DAY);
		const month = d.getMonth() + 1;
		let month_str = month.toString();
		if (month < 10) {
			month_str = "0" + month_str;
		}
		return `${d.getFullYear()}-${month_str}-${d.getDate()}`;
	},
};
