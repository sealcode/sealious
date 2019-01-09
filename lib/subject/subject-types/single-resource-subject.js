"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const Subject = locreq("lib/subject/subject.js");
const Errors = locreq("lib/response/error.js");

const CollectionFieldSubject = require("./collection-field-subject.js");

const SingleResource = function(app, collection, resource_id) {
	this.collection = collection;
	this.resource_id = resource_id;
	this.name = "SingleResource";

	this.get_resource = function(context, args) {
		return SingleResource.prototype.__get_resource(
			app.Datastore,
			this.collection,
			this.resource_id,
			context,
			args
		);
	};

	this.delete_resource = function(context, args) {
		const self = this;
		return SingleResource.prototype.__delete_resource(
			app.Datastore,
			self.collection,
			self.resource_id,
			context,
			args
		);
	};

	this.edit_resource = function(
		context,
		values_to_patch,
		delete_empty_values
	) {
		const self = this;
		return SingleResource.prototype.__edit_resource(
			app.Datastore,
			self.collection,
			self.resource_id,
			context,
			values_to_patch,
			delete_empty_values
		);
	};
};

SingleResource.prototype = Object.create(Subject.prototype);

SingleResource.prototype.__get_resource = function(
	datastore,
	collection,
	resource_id,
	context,
	args
) {
	args = args || {};

	return datastore
		.find(collection.name, { sealious_id: resource_id }, {})
		.then(function(db_entries) {
			if (db_entries[0] === undefined) {
				throw new Errors.NotFound(
					`${collection.name}: id ${resource_id} not found`
				);
			} else {
				return collection.get_resource_representation(
					context,
					db_entries[0],
					args.format
				);
			}
		})
		.then(function(resource_representation) {
			return collection
				.check_if_action_is_allowed(
					context,
					"show",
					resource_representation
				)
				.then(function() {
					return resource_representation;
				});
		});
};

SingleResource.prototype.__edit_resource = function(
	datastore,
	collection,
	resource_id,
	context,
	values_to_patch,
	delete_empty_values
) {
	// replaces just the provided values. Equivalent of PATCH request

	delete_empty_values =
		delete_empty_values === undefined ? false : delete_empty_values;

	let resource_representation;

	return SingleResource.prototype
		.__get_resource(datastore, collection, resource_id, context, {})
		.then(function(resource_data) {
			resource_representation = resource_data;
			return collection.check_if_action_is_allowed(
				context,
				"edit",
				resource_representation
			);
		})
		.then(function() {
			return collection.validate_field_values(
				context,
				delete_empty_values,
				values_to_patch,
				resource_representation
			);
		})
		.then(function() {
			return collection.encode_field_values(
				context,
				values_to_patch,
				resource_representation
			);
		})
		.then(function(encoded_values) {
			const query = { _metadata: resource_representation._metadata };
			query._metadata.last_modified_context = context;
			for (const field_name in encoded_values) {
				query[field_name] = encoded_values[field_name];
			}
			return datastore.update(
				collection.name,
				{ sealious_id: resource_id },
				{ $set: query }
			);
		})
		.then(function(patch_result) {
			if (patch_result.result.n !== 1) {
				throw new Error("Wrong amount of resources (!=1) modified");
			}
			return SingleResource.prototype.__get_resource(
				datastore,
				collection,
				resource_id,
				context,
				resource_id
			);
		});
};

SingleResource.prototype.__delete_resource = function(
	datastore,
	collection,
	resource_id,
	context,
	args
) {
	// abstraction seems to be leaking here: should we use context or SuperContext here?

	return SingleResource.prototype
		.__get_resource(datastore, collection, resource_id, context, {})
		.then(function(resource_representation) {
			return collection.check_if_action_is_allowed(
				context,
				"delete",
				resource_representation
			);
		})
		.then(function() {
			return datastore.remove(
				collection.name,
				{
					sealious_id: resource_id,
				},
				{}
			);
		})
		.then(function(data) {
			return Promise.resolve();
		});
};

SingleResource.prototype.perform_action = function(context, action_name, args) {
	switch (action_name) {
		case "show":
			return this.get_resource(context, args);
		case "edit":
			return this.edit_resource(context, args, false);
		case "replace":
			return this.edit_resource(context, args, true);
		case "delete":
			return this.delete_resource(context, args);
		default:
			throw new Errors.DeveloperError(
				`Unknown action for '${
					this.collection.name
				}' resource: '${action_name}'`
			);
	}
};

SingleResource.prototype.get_child_subject = function(key) {
	if (this.collection.fields[key].type.is_subject) {
		return new CollectionFieldSubject(
			this.collection,
			this.resource_id,
			key
		);
	}
};

module.exports = SingleResource;
