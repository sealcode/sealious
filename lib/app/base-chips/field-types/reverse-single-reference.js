"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const Errors = locreq("lib/response/error.js");
const assert = require("assert");

function params_to_cache_key(collection, field_name, params) {
	return `${collection.name}___${field_name}-reverse-single-reference(${
		params.collection.name
	},${params.collection.field_name}).last_update`;
}

async function update_cache(
	app,
	collection,
	field_name,
	params,
	resource_ids = undefined
) {
	let pipeline;
	const referencing_field_name = params.field_name;
	const referencing_collection = params.collection;
	if (resource_ids) {
		assert(Array.isArray(resource_ids));
		pipeline = [
			{ $match: { [`body.${referencing_field_name}`]: { $in: resource_ids } } },
		];
	} else {
		pipeline = [];
	}
	pipeline.push({
		$group: {
			_id: `$body.${referencing_field_name}`,
			referenced_by: { $push: `$sealious_id` },
		},
	});
	const to_update = await app.Datastore.aggregate(
		referencing_collection.name,
		pipeline
	);
	if (resource_ids) {
		for (let resource_id of resource_ids) {
			if (to_update.filter(e => e._id === resource_id).length === 0) {
				to_update.push({ _id: resource_id, referenced_by: [] });
			}
		}
	}
	for (let entry of to_update) {
		await app.Datastore.update(
			collection.name,
			{ sealious_id: entry._id },
			{ $set: { [`body.${field_name}`]: entry.referenced_by } }
		);
	}
}

const reverse_single_reference_factory = app => {
	return {
		name: "reverse-single-reference",

		get_description: function() {
			return "Shows which resources from given collection point to this resource in a given field.";
		},

		get_default_value: async () => [],

		is_proper_value: function(context, params, new_value) {
			return context.is_super
				? Promise.resolve()
				: Promise.reject("This is a read-only field");
		},

		filter_to_query: async function(context, params, field_filter) {
			if (typeof field_filter !== "object") {
				return {
					$eq: field_filter,
				};
			}
			const matches = await app.run_action(
				context,
				["collections", params.collection.name],
				"show",
				{
					filter: field_filter,
				}
			);
			const ids = matches.map(resource => resource.id);
			return {
				$in: ids,
			};
		},

		format: function(context, params, decoded_value, format) {
			// format can be "expand" or "deep-expand:<depth>", like "deep-expand:3"
			if (!format) {
				return decoded_value; // just the IDs
			}

			const format_params = format.split(":");

			if (!["expand", "deep-expand"].includes(format_params[0])) {
				return decoded_value;
			}

			const query_format = {};
			if (format_params[0] === "deep-expand" && format_params[1] > 1) {
				for (const field_name in params.collection.fields) {
					const field = params.collection.fields[field_name];
					if (field.type.name === "single_reference") {
						query_format[field_name] = `deep-expand:${parseInt(
							format_params[1],
							10
						) - 1}`;
					}
				}
			}
			const resource_ids = decoded_value;
			return Promise.map(resource_ids, async resource_id =>
				app.run_action(
					context,
					["collections", params.collection.name, resource_id],
					"show",
					{ format: query_format }
				)
			);
		},

		init: async (collection, field_name, params) => {
			assert(
				params.collection instanceof app.Sealious.Collection,
				"'params.collection' should be an instance of Collection"
			);
			assert(
				params.collection.fields[params.field_name],
				`Collection '${
					params.collection.name
				}' does not contain a field named ${params.field_name}.`
			);
			app.on("start", async () => {
				const last_modified_resource_in_reference_collection = (await app.run_action(
					new app.Sealious.SuperContext(),
					["collections", params.collection.name],
					"show",
					{
						sort: { "last_modified_context.timestamp": "desc" },
						pagination: { items: 1 },
					}
				))[0];

				if (last_modified_resource_in_reference_collection) {
					const last_modified_resource_timestamp =
						last_modified_resource_in_reference_collection.last_modified_context
							.timestamp;
					const last_field_cache_update =
						(await app.Metadata.get(
							params_to_cache_key(collection, field_name, params)
						)) || 0;
					if (last_modified_resource_timestamp > last_field_cache_update) {
						await update_cache(app, collection, field_name, params);
						await app.Metadata.set(
							params_to_cache_key(collection, field_name, params),
							Date.now()
						);
					}
				}
			});
			app.on(
				new RegExp(`post:collections\.${params.collection.name}:create`),
				async (path, event_params, resource) => {
					const referenced_id = resource.body[params.field_name];
					await update_cache(app, collection, field_name, params, [
						referenced_id,
					]);
				}
			);
			app.on(
				new RegExp(`post:collections\.${params.collection.name}\..*:delete`),
				async (path, event_params, resource) => {
					const deleted_id = path[2];
					const affected = await app.Datastore.find(collection.name, {
						[`body.${field_name}`]: deleted_id,
					});
					const affected_ids = affected.map(document => document.sealious_id);
					await update_cache(app, collection, field_name, params, affected_ids);
				}
			);
			app.on(
				new RegExp(`post:collections\.${params.collection.name}\..*:edit`),
				async (path, event_params, resource) => {
					if (!event_params.hasOwnProperty(params.field_name)) return;
					const edited_id = path[2];
					const no_longer_referenced = await app.Datastore.find(
						collection.name,
						{
							[`body.${field_name}`]: edited_id,
						}
					);
					const affected_ids = no_longer_referenced.map(
						document => document.sealious_id
					);
					if (event_params[params.field_name]) {
						affected_ids.push(event_params[params.field_name]);
					}
					await update_cache(app, collection, field_name, params, affected_ids);
				}
			);
		},
	};
};

module.exports = reverse_single_reference_factory;
