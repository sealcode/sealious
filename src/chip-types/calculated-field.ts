import App from "../app/app";
import Context from "../context";
import { CollectionItem } from "../main";
import Collection from "./collection";

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
