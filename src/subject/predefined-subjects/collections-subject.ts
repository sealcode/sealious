import * as Errors from "../../response/errors";
import { NoActionSubject } from "../subject.js";

import CollectionSubject from "../subject-types/collection-subject.js";
import { App } from "../../main";

export default class CollectionsSubject extends NoActionSubject {
	resource_collections: { [collection_name: string]: CollectionSubject } = {};
	constructor(app: App) {
		super(app);

		this.resource_collections = {};
		const collections = app.ChipManager.getChipsByType("collection");
		for (const collection_name in collections) {
			const collection = collections[collection_name];
			this.resource_collections[collection_name] = new CollectionSubject(
				app,
				collection
			);
		}
	}

	getName = () => "collections";

	async getChildSubject(key: string) {
		if (this.resource_collections[key] === undefined) {
			throw new Errors.BadSubjectPath(`Unknown collection: '${key}'.`);
		}
		return this.resource_collections[key];
	}
}
