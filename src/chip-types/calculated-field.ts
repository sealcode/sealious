import App from "../app/app";
import Context from "../context";
import Item from "../../common_lib/response/item";
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
		item: Item,
		db_document: any
	): Promise<ReturnType>;
}
