"use strict";
const locreq = require("locreq")(__dirname);
const assert = require("assert");
const Promise = require("bluebird");

module.exports = function(app) {
	return {
		name: "value-existing-in-collection",
		is_proper_value: async function(context, params, new_value) {
			assert.equal(typeof params.field, "string");
			assert(
				typeof params.include_forbidden === "boolean" ||
					params.include_forbidden === undefined
			);
			const collection = params.collection;
			assert(collection instanceof app.Sealious.Collection);
			await collection.fields[params.field].is_proper_value(
				context,
				new_value
			);
			if (params.include_forbidden) {
				context = new app.Sealious.SuperContext();
			}
			const matches = await app.run_action(
				context,
				["collections", collection.name],
				"show",
				{ filter: { [params.field]: new_value } }
			);
			if (matches.length) {
				return Promise.resolve();
			} else {
				return Promise.reject(
					`No ${collection.name} with ${
						params.field
					} set to ${new_value}`
				);
			}
		},
		encode: async function(context, params, value_in_code, old_value) {
			return params.collection.fields[params.field].encode(
				context,
				value_in_code,
				old_value
			);
		},
		format: function(context, params, decoded_value, format) {
			return params.collection.fields[params.field].format(
				context,
				decoded_value,
				format
			);
		},
		filter_to_query: function(context, params, field_filter) {
			return params.collection.fields[params.field].filter_to_query(
				context,
				field_filter
			);
		},
		get_aggregation_stages: function(context, params, field_name, query) {
			return params.collection.fields[
				params.field
			].get_aggregation_stages(context, field_name, query);
		},
	};
};
