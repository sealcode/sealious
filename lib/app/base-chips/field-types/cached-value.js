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
	init: function(collection, field_name, params) {
		const { refresh_on, get_value, base_field_type } = params;
		this._check_for_possible_recursive_edits(
			app,
			refresh_on,
			collection.name,
			field_name
		);

		const create_action = refresh_on.find(({ event_matcher }) =>
			event_matcher.containsAction("create")
		);

		if (create_action) {
			app.addHook(
				{ when: "after", action: "start" },
				async () =>
					await this._refresh_outdated_cache_values(
						create_action,
						collection,
						field_name,
						params
					)
			);
		}

		for (let { event_matcher, resource_id_getter } of refresh_on) {
			app.addHook(event_matcher, async (emitted_event, resource) => {
				const cache_resource_id = await resource_id_getter(
					emitted_event,
					resource
				);

				await app.run_action(
					new app.Sealious.SuperContext(
						emitted_event.metadata.context
					),
					["collections", collection.name, cache_resource_id],
					"edit",
					{
						[field_name]: await get_value(
							emitted_event.metadata.context,
							cache_resource_id
						),
					}
				);
			});
		}
	},

	_check_for_possible_recursive_edits: function(
		app,
		refresh_on,
		collection_name,
		field_name
	) {
		const { Collection, Resource } = app.Sealious.EventMatchers;
		const doesAnyMatches = refresh_on.some(({ event_matcher }) => {
			if (
				event_matcher instanceof Collection ||
				event_matcher instanceof Resource
			) {
				return event_matcher.collection_name === collection_name;
			}
			event_matcher.subject_path.test(`collections.${collection_name}`);
		});
		if (doesAnyMatches) {
			throw new Error(
				`In the ${collection_name} collection definition you've tried to create the ${field_name} cached-value field that refers to the collection itself. Consider using 'derived-value' field type to avoid problems with endless recurrence.`
			);
		}
	},

	_refresh_outdated_cache_values: async function(
		create_action,
		collection,
		field_name,
		params
	) {
		const referenced_collection_name =
			create_action.event_matcher.collection_name;

		const response = await app.run_action(
			new app.Sealious.SuperContext(),
			["collections", referenced_collection_name],
			"show",
			{
				sort: { "_metadata.last_modified_context.timestamp": "desc" },
				pagination: { items: 1 },
			}
		);

		if (response.empty) {
			return;
		}

		const last_modified_timestamp =
			response.items[0]._metadata.last_modified_context.timestamp;

		const outdated_resources = await app.Datastore.aggregate(
			collection.name,
			[
				{
					$match: {
						$or: [
							{
								[`${field_name}.timestamp`]: {
									$lt: last_modified_timestamp,
								},
							},
							{ [field_name]: { $exists: false } },
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
				await params.get_value(context, resource.sealious_id)
			);
			await app.Datastore.update(
				collection.name,
				{ sealious_id: resource.sealious_id },
				{ $set: { [field_name]: cache_value } }
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
	decode: function(context, params, value_in_db) {
		return this._call_base_method(
			"decode",
			context,
			params,
			value_in_db ? value_in_db.value : null
		);
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
