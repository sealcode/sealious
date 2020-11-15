import Subject from "../subject";
import * as Errors from "../../response/errors";

import App from "../../app/app";
import Collection from "../../chip-types/collection";
import Context from "../../context";
import { LooseObject } from "../types";
import { ActionName } from "../../action";
import ItemList from "../../chip-types/item-list";

/** This subject handles a single resource, given the resource ID. @internal */
export default class SingleResource extends Subject {
	/** The collection of the resource*/
	collection: Collection;
	/** THe id of the resource */
	resource_id: string;

	/** The constructor @internal */
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
		context.app.Logger.debug("SINGLE RESOURCE CONTEXT", "getResource", {
			args,
		});
		const [ret] = await this.collection
			.list(context)
			.ids([this.resource_id])
			.format(args.format)
			.fetch();
		await ret.loadAttachments(context, args.attachments);
		return ret;
	}

	async getChildSubject() {
		return null;
	}

	async editResource(
		context: Context,
		values_to_patch: any,
		delete_empty_values: boolean
	) {
		const item = await this.collection.getByID(context, this.resource_id);
		if (delete_empty_values) {
			item.replace(values_to_patch);
		} else {
			item.setMultiple(values_to_patch);
		}
		await item.save(context);
		await item.decode(context);
		return item;
	}

	async deleteResource(context: Context, _: LooseObject) {
		return (
			await this.collection.getByID(context, this.resource_id)
		).remove(context);
	}
}
