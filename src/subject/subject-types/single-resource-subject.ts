import Subject from "../subject";
import * as Errors from "../../response/errors";
import SingleItemResponse from "../../../common_lib/response/single-item-response";

import assignAttachments from "../attachments/attachment-assigner";

import App from "../../app/app";
import Collection from "../../chip-types/collection";
import Context from "../../context";
import Item from "../../../common_lib/response/item";
import { LooseObject, AttachmentParams } from "../types";
import { ActionName } from "../../action";

export default class SingleResource extends Subject {
	collection: Collection;
	resource_id: string;

	constructor(app: App, collection: Collection, resource_id: string) {
		super(app);
		this.collection = collection;
		this.resource_id = resource_id;
	}
	getName() {
		return "SingleResource";
	}
	async performAction(context: Context, action_name: ActionName, args?: any) {
		switch (action_name) {
			case "show":
				return this.getResource(context, args);
			case "edit":
				return this.editResource(context, args, false);
			case "replace":
				return this.editResource(context, args, true);
			case "delete":
				return this.deleteResource(context, args);
			default:
				throw new Errors.DeveloperError(
					`Unknown action for '${this.collection.name}' resource: '${action_name}'`
				);
		}
	}
	async getResource(
		context: Context,
		args: { format?: {}; attachments?: LooseObject }
	) {
		const item = await this.__getResource(context, args);

		let attachments, fieldsWithAttachments;
		if (args.attachments && typeof args.attachments === "object") {
			({
				attachments,
				fieldsWithAttachments,
			} = await assignAttachments(
				this.app,
				context,
				args as AttachmentParams,
				this.collection,
				[item]
			));
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
	async __getResource(context: Context, { format }: { format?: {} }) {
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
		const resource_representation = await this.collection.getResourceRepresentation(
			context,
			db_entries[0],
			format
		);

		await this.collection.checkIfActionIsAllowed(
			context,
			"show",
			resource_representation as Item
		);

		return resource_representation as Item;
	}

	async getChildSubject(key: string) {
		return null;
	}

	async editResource(
		context: Context,
		values_to_patch: any,
		delete_empty_values: boolean
	) {
		// replaces just the provided values. Equivalent of PATCH request
		const resource_representation = await this.__getResource(context, {});

		await this.collection.checkIfActionIsAllowed(
			context,
			"edit",
			resource_representation
		);

		await this.collection.validateFieldValues(
			context,
			delete_empty_values,
			values_to_patch,
			resource_representation
		);
		const encoded_values = await this.collection.encodeFieldValues(
			context,
			values_to_patch,
			resource_representation
		);

		const query: LooseObject = {
			_metadata: resource_representation._metadata,
		};
		query._metadata.last_modified_context = context.toDBEntry();
		for (const field_name in encoded_values) {
			query[field_name] = encoded_values[field_name];
		}
		const patch_result = await this.app.Datastore.update(
			this.collection.name,
			{ sealious_id: this.resource_id },
			{ $set: query }
		);
		if (patch_result.result.n !== 1) {
			throw new Error("Wrong amount of resources (!=1) modified");
		}
		return this.getResource(context, {});
	}

	async deleteResource(context: Context, _: LooseObject) {
		const resource_representation = await this.__getResource(context, {});

		await this.collection.checkIfActionIsAllowed(
			context,
			"delete",
			resource_representation
		);

		await this.app.Datastore.remove(
			this.collection.name,
			{ sealious_id: this.resource_id },
			true
		);
	}
}
