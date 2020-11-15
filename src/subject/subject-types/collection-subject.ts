import Collection from "../../chip-types/collection";
import * as Errors from "../../response/errors";
import Subject from "../subject";
import Context from "../../context";
import SingleResource from "./single-resource-subject";
import { ResourceCreated } from "../../../common_lib/response/responses";
import { LooseObject } from "../types";
import {
	CreateActionName,
	ShowActionName,
	DeleteActionName,
} from "../../action";
import { ItemFields } from "../../chip-types/collection-item-body";

//
//
//
//
//   !!! many of these methods should be moved to the collection
//   !!! class, this should be a lightweight controller
//
//
//
//

export default class CollectionSubject extends Subject {
	collection: Collection;
	named_filters: Array<string>;
	ids: Array<string>;

	getName() {
		return "Collection";
	}

	constructor(
		collection: Collection,
		named_filters: Array<string> = [],
		ids: Array<string> = []
	) {
		super(collection.app);
		this.collection = collection;
		this.named_filters = named_filters;
		this.ids = ids;
	}

	async performAction(
		context: Context,
		action_name: CreateActionName | ShowActionName | DeleteActionName,
		params: any
	) {
		switch (action_name) {
			case "create":
				return this.createResource(context, params);
			case "show":
				return this.listResources(context, params);
			case "delete":
				return this.delete();
			default:
				throw new Errors.DeveloperError(
					`Unknown action for '${this.collection.name}' collection: '${action_name}'`
				);
		}
	}

	delete() {
		throw new Errors.NotFound("Cannot delete a collection.");
	}

	async getChildSubject(path_element: string | Array<string>) {
		if (path_element[0] === "@") {
			return new CollectionSubject(this.collection, [
				...this.named_filters,
				path_element.slice(1) as string,
			]);
		} else if (path_element instanceof Array) {
			const ids = path_element;
			return new CollectionSubject(this.collection, [], ids);
		}
		const resource_id = path_element;
		return new SingleResource(this.app, this.collection, resource_id);
	}

	async listResources(context: Context, params: LooseObject) {
		this.app.Logger.debug2(
			"SUBJECT",
			`Running listResources on ${this.collection.name}`,
			params
		);
		const ret = await this.collection
			.list(context)
			.setParams(params)
			.fetch();
		this.app.Logger.debug("SUBJECT", "listResources returning", ret);
		return ret;
	}

	async createResource(context: Context, body: ItemFields<any>) {
		this.app.Logger.debug2(
			"SUBJECT",
			`Running createResource on ${this.collection.name}`,
			body
		);
		const item = this.collection.make();
		item.setMultiple(body);
		await item.save(context);
		await item.decode(context);
		return new ResourceCreated(item);
	}
}
