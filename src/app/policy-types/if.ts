import {
	Policies,
	App,
	Policy,
	SpecialFilter,
	Context,
	Queries,
	CollectionItem,
} from "../../main";
import { PolicyDefinition } from "../../chip-types/policy";

export default class If extends Policy {
	static type_name = "if";
	collection_name: string;
	filter_name: string;
	strategy_when: { [key in "true" | "false"]: Policy };
	constructor([
		collection_name,
		special_filter_name,
		when_true,
		when_false = Policies.Noone,
	]: [string, string, PolicyDefinition, PolicyDefinition?]) {
		super([collection_name, special_filter_name, when_true, when_false]);
		this.filter_name = special_filter_name;
		this.collection_name = collection_name;
		this.strategy_when = {
			true: Policy.fromDefinition(when_true),
			false: Policy.fromDefinition(when_false),
		};
	}

	getFilter(app: App): SpecialFilter {
		return app.collections[this.collection_name].getNamedFilter(
			this.filter_name
		);
	}

	async constructQuery(context: Context) {
		const filtering_query = await this.getFilter(
			context.app
		).getFilteringQuery();
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

	async _getRestrictingQuery(context: Context) {
		return this.constructQuery(context);
	}
	async checkerFunction(
		context: Context,
		item_getter: () => Promise<CollectionItem>
	) {
		const item = await item_getter();
		const query = await this.constructQuery(context);
		query.match({ id: item.id });
		const results = await context.app.Datastore.aggregate(
			item.collection.name,
			query.toPipeline()
		);
		if (!results.length) {
			return Policy.deny(this.getFilter(context.app).getNopassReason());
		}
		return Policy.allow(
			context.app.i18n("policy_if_allow", [this.filter_name])
		);
	}
	isItemSensitive = async () => true;
}
