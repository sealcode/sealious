"use strict";
const { getDateTime } = require("../../../utils/get-datetime.js");

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
		const { refresh_on, get_value, base_field_type } = params;
		const actions = Object.keys(refresh_on);
		const create_action = actions.find(action => action.endsWith("create"));
		if (create_action) {
			app.on(
				"start",
				async () =>
					await this._refresh_outdated_cache_values(
						create_action,
						collection,
						field_name,
						params
					)
			);
		}

		for (let action of actions) {
			const [when, collection_pattern, action_name] = action.split(":");
			const resource_id_getter = refresh_on[action];
			app.EventManager.subscribeTo(
				collection_pattern,
				action_name,
				when,
				async (context, path, event_params, resource) => {
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
							[field_name]: await get_value(cache_resource_id),
						}
					);
				}
			);
		}
	},
	_refresh_outdated_cache_values: async function(
		create_action,
		collection,
		field_name,
		params
	) {
		const referenced_collection_name = create_action.split(":")[1];
		const last_modified_resource = (await app.run_action(
			new app.Sealious.SuperContext(),
			["collections", referenced_collection_name],
			"show",
			{
				sort: { "last_modified_context.timestamp": "desc" },
				pagination: { items: 1 },
			}
		))[0];

		if (!last_modified_resource) {
			return;
		}

		const last_modified_timestamp =
			last_modified_resource.last_modified_context.timestamp;

		const outdated_resources = await app.Datastore.aggregate(
			collection.name,
			[
				{
					$match: {
						$or: [
							{
								[`body.${field_name}.timestamp`]: {
									$lt: last_modified_timestamp,
								},
							},
							{ [`body.${field_name}`]: { $exists: false } },
						],
					},
				},
			]
		);

		if (!outdated_resources) {
			return;
		}

		const context = new app.Sealious.SuperContext();
		for (let resource of outdated_resources) {
			const cache_value = await this.encode(
				context,
				params,
				await params.get_value(resource.sealious_id)
			);
			await app.Datastore.update(
				collection.name,
				{ sealious_id: resource.sealious_id },
				{ $set: { [`body.${field_name}`]: cache_value } }
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
