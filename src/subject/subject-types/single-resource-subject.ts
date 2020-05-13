import Subject from "../subject.js";
import * as Errors from "../../response/errors.js";
import SingleItemResponse from "../../../common_lib/response/single-item-response.js";

import assignAttachments from "../attachments/attachment-assigner.js";

import CollectionFieldSubject from "./collection-field-subject.js";
import App from "../../app/app.js";
import Collection from "../../chip-types/collection.js";
import Context from "../../context.js";

export default class SingleResource extends Subject {
	collection: Collection;
	resource_id: string;
	name = "SingleResource";
	app: App;
	constructor(app: App, collection: Collection, resource_id: string) {
		super();
		this.collection = collection;
		this.resource_id = resource_id;
		this.app = app;
	}

	async get_resource(context: Context, { format }: { format?: {} }) {
		const db_entries = await this.app.Datastore.find(
			this.collection.name,
			{ sealious_id: this.resource_id },
			{}
		);
		if (db_entries[0] === undefined) {
			throw new Errors.NotFound(
				`${this.collection.name}: id ${this.resource_id} not found`
			);
		}
		const resource_representation = await this.collection.get_resource_representation(
			context,
			db_entries[0],
			format
		);

		await this.collection.check_if_action_is_allowed(
			context,
			"show",
			resource_representation
		);

		let attachments, fieldsWithAttachments;
		if (args.attachments && typeof args.attachments === "object") {
			({
				attachments,
				fieldsWithAttachments,
			} = await assignAttachments(app, context, args, this.collection, [
				item,
			]));
		} else {
			attachments = {};
			fieldsWithAttachments = {};
		}
		return new SingleItemResponse({
			item,
			attachments,
			fieldsWithAttachments,
		});
	}

	async getChildSubject(key: string) {
		if (this.collection.fields[key].type.is_subject) {
			return new CollectionFieldSubject(
				this.collection,
				this.resource_id,
				key
			);
		}
		return null;
	}

	async edit_resource(
		context: Context,
		values_to_patch: any,
		delete_empty_values: boolean
	) {
		// replaces just the provided values. Equivalent of PATCH request

		delete_empty_values =
			delete_empty_values === undefined ? false : delete_empty_values;

		let resource_representation: {};

		const resource_representation = await this.get_resource(context, {});
		await this.collection.check_if_action_is_allowed(
			context,
			"edit",
			resource_representation
		);

		await this.collection.validate_field_values(
			context,
			delete_empty_values,
			values_to_patch,
			resource_representation
		);
		const encoded_values = await this.collection.encode_field_values(
			context,
			values_to_patch,
			resource_representation
		);

		const query = { _metadata: resource_representation._metadata };
		query._metadata.last_modified_context = context;
		for (const field_name in encoded_values) {
			query[field_name] = encoded_values[field_name];
		}
		const patch_result = await this.app.Datastore.update(
			this.collection.name,
			{ sealious_id: resource_id },
			{ $set: query }
		);
		if (patch_result.result.n !== 1) {
			throw new Error("Wrong amount of resources (!=1) modified");
		}
		return this.get_resource(context, {});
	}
}

SingleResource.prototype.SingleResource.prototype.__delete_resource = function (
	datastore,
	collection,
	resource_id,
	context,
	args
) {
	// abstraction seems to be leaking here: should we use context or SuperContext here?

	return SingleResource.prototype
		.__get_resource(datastore, collection, resource_id, context, {})
		.then(function (resource_representation) {
			return collection.check_if_action_is_allowed(
				context,
				"delete",
				resource_representation
			);
		})
		.then(function () {
			return datastore.remove(
				collection.name,
				{
					sealious_id: resource_id,
				},
				{}
			);
		})
		.then(function (data) {
			return Promise.resolve();
		});
};

SingleResource.prototype.perform_action = function (
	context,
	action_name,
	args
) {
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
				`Unknown action for '${this.collection.name}' resource: '${action_name}'`
			);
	}
};
