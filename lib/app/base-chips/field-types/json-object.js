const flattenObjectToDotNotation = require("../../../utils/flatten-object-to-dot-notation");

("use strict");

module.exports = {
	name: "json-object",
	get_description: function() {
		return "Stores json object value.";
	},
	is_proper_value: async function(context, params, new_value) {
		let stringified_value;
		try {
			stringified_value = JSON.stringify(new_value);
		} catch (e) {
			return Promise.reject(
				`Value ${new_value} cannot be represented as JSON object`
			);
		}
		if (!stringified_value.startsWith("{")) {
			return Promise.reject("A primitive, not an object!");
		}
	},
	encode: function(context, params, value_in_code) {
		return JSON.parse(JSON.stringify(value_in_code));
	},
	get_aggregation_stages: function(
		context,
		params,
		field_name,
		field_value_path,
		query_params
	) {
		const filter = query_params.filter && query_params.filter[field_name];
		if (!filter) {
			return [];
		}

		const flattened_filter = flattenObjectToDotNotation(
			field_value_path,
			filter
		);
		for (let prop_path of Object.keys(flattened_filter)) {
			const filter_entry = flattened_filter[prop_path];
			flattened_filter[prop_path] = get_query_with_proper_operator(
				filter_entry
			);
		}
		return [{ $match: flattened_filter }];
	},
};

function get_query_with_proper_operator(filter) {
	let filter_as_number = parseFloat(filter, 10);
	return Number.isFinite(filter_as_number)
		? { $in: [filter, filter_as_number] }
		: { $eq: filter };
}
