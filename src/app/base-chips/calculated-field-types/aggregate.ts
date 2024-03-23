import {
	CalculatedField,
	Context,
	App,
	Queries,
	Collection,
	CollectionItem,
} from "../../../main.js";

type StagesGetter = (
	context: Context,
	item: CollectionItem,
	db_document: any
) => Queries.QueryStage[];

export default class Aggregate extends CalculatedField<any> {
	name = "aggregate";
	stages_getter: StagesGetter;
	constructor(app: App, collection: Collection, stages_getter: StagesGetter) {
		super(app, collection);
		this.stages_getter = stages_getter;
	}
	async calculate(context: Context, item: CollectionItem, db_document: any) {
		const stages = this.stages_getter(context, item, db_document);
		const documents = await this.app.Datastore.aggregate(
			this.collection.name,
			stages
		);

		if (documents.length) {
			return documents[0].result;
		} else {
			return null;
		}
	}
}
