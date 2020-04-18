const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const Errors = locreq("lib/response/error.js");
const assert = require("assert");

function params_to_cache_key(collection, field_name, params) {
	return `${collection.name}___${field_name}-reverse-single-reference(${params.collection},${params.field_name}).last_update`;
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
	if (resource_ids) {
		assert(Array.isArray(resource_ids));
		pipeline = [
			{
				$match: {
					[referencing_field_name]: { $in: resource_ids },
				},
			},
		];
	} else {
		pipeline = [];
	}
	pipeline.push({
		$group: {
			_id: `$${referencing_field_name}`,
			referenced_by: { $push: "$sealious_id" },
		},
	});
	const to_update = await app.Datastore.aggregate(
		params.referencing_collection.name,
		pipeline
	);
	if (resource_ids) {
		for (let resource_id of resource_ids) {
			if (to_update.filter((e) => e._id === resource_id).length === 0) {
				to_update.push({ _id: resource_id, referenced_by: [] });
			}
		}
	}
	for (let entry of to_update) {
		await app.Datastore.update(
			collection.name,
			{ sealious_id: entry._id },
			{ $set: { [field_name]: entry.referenced_by } }
		);
	}
}

const reverse_single_reference_factory = (app) => {
	return {
		name: "reverse-single-reference",

		get_description: function () {
			return "Shows which resources from given collection point to this resource in a given field.";
		},

		get_default_value: async () => [],
		is_old_value_sensitive: true,

		is_proper_value: function (context, params, new_value) {
			return context.is_super
				? Promise.resolve()
				: Promise.reject("This is a read-only field");
		},

		filter_to_query: async function (context, params, field_filter) {
			if (typeof field_filter !== "object") {
				return {
					$eq: field_filter,
				};
			}
			const { items } = await app.run_action(
				context,
				["collections", params.collection],
				"show",
				{ filter: field_filter }
			);
			return {
				$in: items.map((resource) => resource.id),
			};
		},

		get_attachment_loader: function (context, omit_it, name, params) {
			return new app.Attachments.ReferenceToCollection(
				context,
				name,
				params
			);
		},

		init: async (collection, field_name, params) => {
			params.referencing_collection = app.ChipManager.get_chip(
				"collection",
				params.collection
			);
			assert(
				params.referencing_collection.fields[params.field_name],
				`Collection '${params.collection}' does not contain a field named ${params.field_name}.`
			);

			app.addHook({ when: "after", action: "start" }, async () => {
				const response = await app.run_action(
					new app.Sealious.SuperContext(),
					["collections", params.collection],
					"show",
					{
						sort: {
							"_metadata.last_modified_context.timestamp": "desc",
						},
						pagination: { items: 1 },
					}
				);

				if (response.empty) {
					return;
				}

				const last_modified_resource_in_reference_collection =
					response.items[0];

				if (last_modified_resource_in_reference_collection) {
					const last_modified_resource_timestamp =
						last_modified_resource_in_reference_collection._metadata
							.last_modified_context.timestamp;
					const last_field_cache_update =
						(await app.Metadata.get(
							params_to_cache_key(collection, field_name, params)
						)) || 0;
					if (
						last_modified_resource_timestamp >
						last_field_cache_update
					) {
						await update_cache(app, collection, field_name, params);
						await app.Metadata.set(
							params_to_cache_key(collection, field_name, params),
							Date.now()
						);
					}
				}
			});

			app.addHook(
				new app.Sealious.EventMatchers.Collection({
					when: "after",
					collection_name: params.collection,
					action: "create",
				}),
				async (emitted_event, resource) => {
					const referenced_id = resource[params.field_name];

					await update_cache(app, collection, field_name, params, [
						referenced_id,
					]);
				}
			);

			app.addHook(
				new app.Sealious.EventMatchers.Resource({
					when: "after",
					collection_name: params.collection,
					action: "delete",
				}),
				async (emitted_event, data) => {
					const deleted_id = emitted_event.subject_path.split(".")[2];
					const affected = await app.Datastore.find(collection.name, {
						[field_name]: deleted_id,
					});
					const affected_ids = affected.map(
						(document) => document.sealious_id
					);
					await update_cache(
						app,
						collection,
						field_name,
						params,
						affected_ids
					);
				}
			);

			app.addHook(
				new app.Sealious.EventMatchers.Resource({
					when: "after",
					collection_name: params.collection,
					action: "edit",
				}),
				async ({ metadata, subject_path }, resource) => {
					if (!metadata.params.hasOwnProperty(params.field_name))
						return;
					const edited_id = subject_path.split(".")[2];
					const no_longer_referenced = await app.Datastore.find(
						collection.name,
						{
							[field_name]: edited_id,
						}
					);
					const affected_ids = no_longer_referenced.map(
						(document) => document.sealious_id
					);
					if (metadata.params[params.field_name]) {
						affected_ids.push(metadata.params[params.field_name]);
					}
					await update_cache(
						app,
						collection,
						field_name,
						params,
						affected_ids
					);
				}
			);
		},
	};
};

module.exports = reverse_single_reference_factory;
