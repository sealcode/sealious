"use strict";
const Promise = require("bluebird");
const expandHash = require("expand-hash");

const FieldTypeDescription = require("../data-structures/field-type-description.js");

const default_methods = {
	init: function() {
		return null;
	},
	has_index: function(params) {
		return false;
	},
	is_proper_value: function(context, params, new_value, old_value) {
		return Promise.resolve();
	},
	format: function(context, params, decoded_value, format_params) {
		return decoded_value;
	},
	encode: function(context, params, value_in_code) {
		return value_in_code;
	},
	get_description: function(context, params) {
		return new FieldTypeDescription(this.name);
	},
	decode: function(context, params, value_in_database) {
		return value_in_database;
	},
	filter_to_query: function(context, params, query) {
		return Promise.resolve(this.encode(context, params, query)).then(
			function(encoded_value) {
				return {
					$eq: encoded_value,
				};
			}
		);
	},
	full_text_search_enabled: function() {
		return false;
	},
	get_aggregation_stages: async function(
		context,
		params,
		field_name,
		field_value_path,
		query_params
	) {
		const self = this;
		if (!query_params || !query_params.filter) return [];
		const expanded_filter = expandHash(query_params.filter);
		let field_filter = expanded_filter[field_name];
		if (
			field_filter &&
			field_filter.length === 1 &&
			field_filter[0] instanceof Array
		) {
			field_filter = field_filter[0]; // to fix an edge case where instead of array of values the array is wrapped within another array
		}
		if (!(field_name in expanded_filter)) {
			return [];
		}
		if (field_name in expanded_filter && field_filter === undefined)
			return [{ $match: { [field_value_path]: { $exists: false } } }];
		let new_filter = null;
		if (field_filter instanceof Array) {
			new_filter = await Promise.all(
				field_filter.map(function(element) {
					return self.encode(context, params, element);
				})
			).then(filters => {
				return { $in: filters };
			});
		} else {
			new_filter = await self.filter_to_query(
				context,
				params,
				field_filter
			);
		}
		return [{ $match: { [field_value_path]: new_filter } }];
	},
};

module.exports = default_methods;
