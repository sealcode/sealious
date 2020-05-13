import Promise from "bluebird";

import Subject from "../subject.js";
import Errors from "../../response/error.js";
import Collection from "../../chip-types/collection.js";
import { ActionName } from "../../action.js";
import Context from "../../context.js";

export default class CollectionFieldSubject extends Subject {
	name: string;
	collection: Collection;
	field_name: string;
	field_type: string;
	resource_id: string;
	constructor(
		collection: Collection,
		resource_id: string,
		field_name: string
	) {
		super();
		this.name = "CollectionFieldSubject";

		this.collection = collection;
		this.resource_id = resource_id;
		this.field_name = field_name;
		this.field_type = collection[field_name].type;
	}

	perform_action(context: Context, action_name: ActionName, params: any) {
		params = params || {};
		params = {
			resource_id: this.resource_id,
			field_name: this.field_name,
			collection: this.collection,
			...params,
		};
		if (this.field_type.actions[action_name]) {
			return Promise.resolve(
				this.field_type.actions[action_name](context, params)
			);
		} else {
			throw new Errors.DeveloperError(`Unknown action: '${action_name}'`);
		}
	}

	get_child_subject(key) {
		const self = this;
		return Promise.try(function () {
			return self.field_type.get_child_subject(key);
		});
	}
}
