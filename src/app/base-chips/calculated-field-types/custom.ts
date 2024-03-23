import {
	CalculatedField,
	Context,
	App,
	Collection,
	CollectionItem,
} from "../../../main.js";

type Getter<ReturnType> = (
	contect: Context,
	item: CollectionItem,
	db_document: any
) => Promise<ReturnType>;

export default class Custom<ReturnType> extends CalculatedField<ReturnType> {
	getter: Getter<ReturnType>;
	name = "calculated";
	constructor(app: App, collection: Collection, getter: Getter<ReturnType>) {
		super(app, collection);
		this.getter = getter;
	}
	calculate(context: Context, item: CollectionItem, db_document: any) {
		return this.getter(context, item, db_document);
	}
}
