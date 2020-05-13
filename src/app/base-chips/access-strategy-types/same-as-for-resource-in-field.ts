import AccessStrategy from "../../../chip-types/access-strategy";
import { App, Context, SuperContext } from "../../../main";
import Collection, {
	CollectionDefinition,
} from "../../../chip-types/collection";
import { ActionName } from "../../../action";
import SingleItemResponse from "../../../../common_lib/response/single-item-response";
import QueryStage from "../../../datastore/query-stage";

const Query = require("../../../datastore/query.js").default;

export default class SameAsForResourceInField extends AccessStrategy {
	current_collection: Collection;
	referenced_collection: Collection;
	referenced_access_strategy: AccessStrategy;
	field: string;
	constructor(
		app: App,
		{
			action_name,
			collection,
			field,
		}: {
			action_name: ActionName;
			collection: CollectionDefinition;
			field: string;
		}
	) {
		super(app, { action_name, collection, field });
		this.current_collection = Collection.fromDefinition(app, collection);
		this.referenced_collection = this.current_collection.fields[
			field
		].params.collection;
		this.referenced_access_strategy = this.referenced_collection.getAccessStrategy(
			"show"
		);
		this.field = field;
	}

	async getRestrictingQuery(context: Context) {
		const referenced_restricting_query = await this.referenced_access_strategy.getRestrictingQuery(
			context
		);

		if (
			referenced_restricting_query instanceof Query.DenyAll ||
			referenced_restricting_query instanceof Query.AllowAll
		) {
			return referenced_restricting_query;
		}

		const query = new Query();
		const parent_prefix = query.lookup({
			from: this.referenced_collection,
			localField: this.field,
			foreignField: "sealious_id",
		});

		const referenced_restricting_pipeline = referenced_restricting_query.toPipeline();
		add_parent_prefix_to_pipeline(
			referenced_restricting_pipeline,
			parent_prefix
		);

		const pipeline = query
			.toPipeline()
			.concat(referenced_restricting_pipeline);

		return Query.fromCustomPipeline(pipeline);
	}
	async checkerFunction(context: Context, response: SingleItemResponse) {
		const sealious_response_in_field = await this.app.run_action(
			new SuperContext(),
			[
				"collections",
				this.referenced_collection.name,
				response[this.field],
			],
			"show"
		);

		return this.referenced_access_strategy.check(
			context,
			sealious_response_in_field
		);
	}
	item_sensitive: true;
}

function add_parent_prefix_to_pipeline(
	pipeline: QueryStage[],
	parent_property: string
) {
	for (let stage of pipeline) {
		add_parent_prefix(stage, parent_property);
	}
}

const prop_regex = /^[a-z0-9_]/;
function add_parent_prefix(group: QueryStage, parent_property: string) {
	return Object.keys(group).reduce((acc, prop) => {
		if (Array.isArray(group[prop])) {
			group[prop] = group[prop].map((subgroup: QueryStage) =>
				add_parent_prefix(subgroup, parent_property)
			);
		} else if (group[prop] instanceof Object) {
			group[prop] = add_parent_prefix(group[prop], parent_property);
		}
		const new_prop = prop_regex.test(prop)
			? parent_property + "." + prop
			: prop;
		acc[new_prop] = group[prop];
		return acc;
	}, {} as { [any: string]: any });
}
