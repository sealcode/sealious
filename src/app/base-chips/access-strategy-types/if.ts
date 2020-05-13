import {
	AccessStrategies,
	App,
	AccessStrategy,
	Collection,
	SpecialFilter,
	Context,
	Queries,
	SingleItemResponse,
} from "../../../main";

export default class If extends AccessStrategy {
	collection: Collection;
	filter: SpecialFilter;
	strategy_when: { [key in "true" | "false"]: AccessStrategy };
	constructor(
		app: App,
		[
			collection_name,
			special_filter_name,
			when_true,
			when_false = "noone",
		]: [
			string,
			string,
			AccessStrategies.AccessStrategyDefinition,
			AccessStrategies.AccessStrategyDefinition
		]
	) {
		super(app, [
			collection_name,
			special_filter_name,
			when_true,
			when_false,
		]);
		this.collection = app.ChipManager.getCollection(collection_name);
		this.filter = this.collection.getNamedFilter(special_filter_name);
		this.strategy_when = {
			true: AccessStrategy.fromDefinition(app, when_true),
			false: AccessStrategy.fromDefinition(app, when_false),
		};
	}

	async constructQuery(context: Context) {
		const filtering_query = await this.filter.getFilteringQuery();
		return new Queries.Or(
			new Queries.And(
				filtering_query,
				await this.strategy_when.true.getRestrictingQuery(context)
			),
			new Queries.And(
				new Queries.Not(filtering_query),
				await this.strategy_when.false.getRestrictingQuery(context)
			)
		);
	}

	async getRestrictingQuery(context: Context) {
		return this.constructQuery(context);
	}
	async checkerFunction(
		context: Context,
		sealious_response: SingleItemResponse
	) {
		const query = await this.constructQuery(context);
		query.match({ sealious_id: sealious_response.id });
		const results = await this.app.Datastore.aggregate(
			sealious_response._metadata.collection_name,
			query.toPipeline()
		);
		if (!results.length) {
			return AccessStrategy.deny(this.filter.getNopassReason());
		}
		return AccessStrategy.allow(
			`the item passes the "${this.filter}" filter`
		);
	}
	isItemSensitive = async () => true;
}
