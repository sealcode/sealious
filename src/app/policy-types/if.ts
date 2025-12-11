import {
	Policies,
	App,
	Policy,
	SpecialFilter,
	Context,
	CollectionItem,
	Queries,
	SpecialFilters,
} from "../../main.js";
import type { PolicyDefinition } from "../../chip-types/policy.js";

type IFPolicyFilter = [string, { [key: string]: unknown }] | string;

export default class If extends Policy {
	static type_name = "if";
	collection_name: string;
	filter: IFPolicyFilter;
	strategy_when: { [key in "true" | "false"]: Policy };
	constructor(
		collection_name: string,
		special_filter: IFPolicyFilter,
		when_true: PolicyDefinition,
		when_false: PolicyDefinition = Policies.Noone
	) {
		super([collection_name, special_filter, when_true, when_false]);
		this.filter = special_filter;
		this.collection_name = collection_name;
		this.strategy_when = {
			true: Policy.fromDefinition(when_true),
			false: Policy.fromDefinition(when_false),
		};
	}

	getFilter(app: App): SpecialFilter {
		const collection = app.collections[this.collection_name];
		if (collection && typeof this.filter === "string") {
			return collection.getNamedFilter(this.filter);
		} else if (collection && Array.isArray(this.filter)) {
			const specialFilter = new SpecialFilters.Matches(
				this.collection_name,
				this.filter[1]
			);
			specialFilter.init(app);
			return specialFilter;
		} else {
			throw new Error("incorrect filter shape or collection is missing");
		}
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
			context.i18n`Item passes '${typeof this.filter === "string" ? this.filter : this.filter[0]}' filter.`
		);
	}
	isItemSensitive = async () => true;
}
