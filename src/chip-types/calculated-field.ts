import type { App } from "../app/app.js";
import type Context from "../context.js";
import type { CollectionItem } from "../main.js";
import type Collection from "./collection.js";

export default abstract class CalculatedField<ReturnType> {
	app: App;
	abstract name: string;
	collection: Collection;
	constructor(app: App, collection: Collection) {
		this.app = app;
		this.collection = collection;
	}

	abstract calculate(
		context: Context,
		item: CollectionItem<any>,
		db_document: any
	): Promise<ReturnType>;
}
