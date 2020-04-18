"use strict";
const assert = require("assert");
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const shortid = require("shortid");
const merge = require("merge");
const clone = require("clone");
const expandHash = require("expand-hash");
const Sealious = locreq("lib/main.js");
const batch_action = require("./_batch_action.js");

const SingleResource = require("./single-resource-subject.js");
const Subject = locreq("lib/subject/subject.js");
const Errors = locreq("lib/response/error.js");
const assignAttachments = locreq(
	"lib/subject/attachments/attachment-assigner.js"
);
const SingleItemResponse = locreq(
	"common_lib/response/single-item-response.js"
);

function CollectionSubject(app, collection, named_filters = [], ids = []) {
	this.collection = collection;
	this.name = "Collection";

	assert(Array.isArray(named_filters));
	this.named_filters = named_filters;

	// these methods are here so they can havve access to 'app' variable

	this.create_resource = function (context, body) {
		return CollectionSubject.prototype.__create_resource(
			app.Datastore,
			this.collection,
			context,
			body
		);
	};

	this.list_resources = async function (context, params) {
		const result = await CollectionSubject.prototype.__list_resources(
			app.Datastore,
			this.collection,
			context,
			params,
			named_filters,
			ids
		);

		if (params.attachments && typeof params.attachments === "object") {
			Object.assign(
				result,
				await assignAttachments(
					app,
					context,
					params,
					this.collection,
					result.items
				)
			);
		}
		await CollectionSubject.prototype.__exclude_items_not_passing_check(
			context,
			this.collection,
			result
		);
		return new app.Sealious.Responses.CollectionResponse(result);
	};

	this.create_many = function (context, params) {
		// test with: http -f POST localhost:8081/api/v1/collections/animals __multiple=true mode=cartesian sources[0][0]=literal sources[0][1][pole]=wartosc sources[0][1][bark]=bork sources[1][0]=collection_fields sources[1][1][collection]=shelters sources[1][1][filter][city]=Poznań sources[1][1][fields][0]=id

		/*
		  params.mode = "batch" | "cartesian"

		  for "cartesian" mode:
		  * 'sources'   - a list of value sources to generate the cartesian product
		    Each source is a 2-element array, where the first element is the source type, and the second one is the params

			source types:
			* 'literal': second element needs to be a key->value map
			* `collection_fields`: values from a collection
			  * collection
			  * filter
			  * fields[]
			  * map_to[]
		*/
		const self = this;
		return batch_action(app, context, params, function (context, body) {
			return app.run_action(
				context,
				["collections", self.collection.name],
				"create",
				body
			);
		});
	};

	this.delete_many = function (context, params) {
		const self = this;
		return batch_action(app, context, params, function (context, body) {
			return app
				.run_action(
					context,
					["collections", self.collection.name],
					"show",
					{
						filter: body,
					}
				)
				.then((sealious_response) => sealious_response.items)
				.each(function (resource) {
					return app.run_action(
						context,
						["collections", self.collection.name, resource.id],
						"delete"
					);
				});
		});
	};

	this.delete = function (context, params) {
		if (params.__multiple) {
			return this.delete_many(context, params);
		} else {
			throw new app.Sealious.Errors.NotFound(
				"Cannot delete a collection. Try using the '__multiple: true' mode"
			);
		}
	};

	this.get_child_subject = async function (key) {
		if (key[0] === "@") {
			return new CollectionSubject(app, collection, [
				...named_filters,
				key.slice(1),
			]);
		} else if (key instanceof Array) {
			const ids = key;
			return new CollectionSubject(app, collection, [], ids);
		}
		const resource_id = key;
		return new SingleResource(app, this.collection, resource_id);
	};
}

CollectionSubject.prototype = Object.create(Subject.prototype);

CollectionSubject.prototype.__create_resource = function (
	datastore,
	collection,
	context,
	body
) {
	return collection
		.check_if_action_is_allowed(context, "create", body)
		.then(function () {
			return collection.validate_field_values(context, true, body);
		})
		.then(function () {
			return collection.encode_field_values(context, body);
		})
		.then(function (encoded_body) {
			const newID = shortid();
			const resource_data = {
				_metadata: {
					collection: collection.name,
					created_context: context,
					last_modified_context: context,
				},
				sealious_id: newID,
				...encoded_body,
			};
			return datastore.insert(collection.name, resource_data, {});
		})
		.then(function (database_entry) {
			return collection.get_resource_representation(
				context,
				database_entry
			);
		})
		.then(function (representation) {
			return new Sealious.Responses.ResourceCreated(representation);
		});
};

CollectionSubject.prototype.__preprocess_resource_filter = function (
	collection,
	context,
	filter
) {
	filter = clone(filter) || {};
	const expanded_filter = expandHash(filter);
	const processed_filter = {};
	for (const field_name in expanded_filter) {
		if (!collection.fields[field_name]) {
			continue;
		}
		const field = collection.fields[field_name];
		const field_filter = expanded_filter[field_name];
		if (field_filter instanceof Array) {
			processed_filter[field_name] = Promise.all(
				field_filter.map(field.encode.bind(field, context))
			).then((filters) => {
				return { $in: filters };
			});
		} else {
			processed_filter[field_name] = field.filter_to_query(
				context,
				field_filter
			);
		}
	}
	return Promise.props(processed_filter);
};

const sealious_to_mongo_sort_param = {
	desc: -1,
	descending: -1,
	asc: 1,
	ascending: 1,
};

const get_output_options = function (collection, params) {
	const output_options = {};

	if (params.pagination) {
		const default_pagination_params = {
			page: 1,
			items: 10,
		};
		const full_pagination_params = merge(
			default_pagination_params,
			params.pagination
		);

		const must_be_int = ["items", "page"];
		must_be_int.forEach(function (attribute_name) {
			if (isNaN(parseInt(full_pagination_params[attribute_name]))) {
				full_pagination_params[attribute_name] =
					default_pagination_params[attribute_name];
			} else {
				full_pagination_params[attribute_name] = parseInt(
					full_pagination_params[attribute_name]
				);
			}
		});

		output_options.skip =
			(full_pagination_params.page - 1) * full_pagination_params.items;
		output_options.amount =
			parseInt(full_pagination_params.items) +
			(parseInt(full_pagination_params.forward_buffer) || 0);
	} else {
		if (params.skip) {
			output_options.skip = parseInt(params.skip);
		}
		if (params.amount) {
			output_options.amount = parseInt(params.count);
		}
	}

	if (params.sort) {
		const full_sort_params = clone(params.sort);
		for (const field_name in full_sort_params) {
			const mongo_sort_param =
				sealious_to_mongo_sort_param[full_sort_params[field_name]];
			if (!mongo_sort_param) {
				const available_sort_keys = Object.keys(
					sealious_to_mongo_sort_param
				).join(", ");
				throw new Errors.BadSubjectAction(
					`Unknown sort key: ${full_sort_params[field_name]}. Available sort keys are: ${available_sort_keys}.`
				);
			}
			full_sort_params[field_name] = mongo_sort_param;
		}
		output_options.sort = full_sort_params;
	}

	return output_options;
};

CollectionSubject.prototype.__list_resources = async function (
	datastore,
	collection,
	context,
	params,
	named_filters,
	ids
) {
	if (params === undefined || params === null) {
		params = {};
	}

	if (params.calculate === "false" || params.calculate === false) {
		params.calculate = false;
	} else if (typeof params.calculate !== "object") {
		params.calculate = true;
	}

	await collection.check_if_action_is_allowed(context, "show");
	const aggregation_stages = await collection.get_aggregation_stages(
		context,
		"show",
		params,
		named_filters,
		ids
	);

	const output_options = get_output_options(this.collection, params);

	const documents = await datastore.aggregate(
		collection.name,
		aggregation_stages,
		{},
		output_options
	);

	const decoded_items = [];

	for (let document of documents) {
		try {
			let item = await collection.get_resource_representation(
				context,
				document,
				params.format,
				params.calculate
			);
			decoded_items.push(item);
		} catch (e) {}
	}

	return { items: decoded_items, attachments: {} };
};

CollectionSubject.prototype.__exclude_items_not_passing_check = async function (
	context,
	collection,
	result
) {
	const access_strategy = collection.get_access_strategy("show");
	const is_item_sensitive = await access_strategy.is_item_sensitive();
	if (!is_item_sensitive) {
		return;
	}
	result.items = await Promise.filter(result.items, async (item) => {
		try {
			await access_strategy.check(
				context,
				new SingleItemResponse({
					item,
					attachments: result.attachments,
					fieldsWithAttachments: result.fieldsWithAttachments,
				})
			);
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	});
};

CollectionSubject.prototype.perform_action = function (
	context,
	action_name,
	args
) {
	switch (action_name) {
		case "create":
			if (args.__multiple) {
				return this.create_many(context, args);
			} else {
				return this.create_resource(context, args);
			}
		case "show":
			return this.list_resources(context, args);
		case "delete":
			return this.delete(context, args);
		default:
			throw new Errors.DeveloperError(
				`Unknown action for '${this.collection.name}' collection: '${action_name}'`
			);
	}
};

CollectionSubject.subject_name = "collection";

module.exports = CollectionSubject;
