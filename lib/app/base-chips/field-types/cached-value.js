"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");

module.exports = app => ({
	name: "cached-value",
	get_description: function() {
		return "Caches custom values. Takes care of cache invalidation.";
	},

	get_default_value: async () => null,
	value_path_after_field_name: ".value",

	is_proper_value: function(context, params, new_value) {
		if (!context.is_super) {
			return Promise.reject("This is a read-only field");
		}

		return this._call_base_method(
			"is_proper_value",
			context,
			params,
			new_value
		);
	},
	filter_to_query: async function(context, params, field_filter) {
		return this._call_base_method(
			"filter_to_query",
			context,
			params,
			field_filter
		);
	},
	init: async function(collection, field_name, params) {
		for (let action of Object.keys(params.refresh_on)) {
			const [when, collection_pattern, action_name] = action.split(":");
			const resource_id_getter = params.refresh_on[action];
			app.EventManager.subscribeTo(
				collection_pattern,
				action_name,
				when,
				async (path, event_params, resource) => {
					const cache_resource_id = await resource_id_getter(
						path,
						event_params,
						resource
					);
					return app.run_action(
						new app.Sealious.SuperContext(),
						["collections", collection.name, cache_resource_id],
						"edit",
						{
							[field_name]: await params.get_value(
								cache_resource_id
							),
						}
					);
				}
			);
		}
	},
	encode: async function(context, params, value) {
		return {
			timestamp: context.timestamp,
			value: await this._call_base_method(
				"encode",
				context,
				params,
				value
			),
		};
	},
	decode: function(context, params, { value }) {
		return this._call_base_method("decode", context, params, value);
	},
	format: function(context, params, decoded_value, format) {
		const base_field_type = app.FieldType(params.base_field_type.name);
		return base_field_type.format(
			context,
			params.base_field_type.params || {},
			decoded_value,
			format
		);
	},
	_call_base_method(method, context, params, arg) {
		const base_field_type = app.FieldType(params.base_field_type.name);
		return base_field_type[method](
			context,
			params.base_field_type.params || {},
			arg
		);
	},
});
