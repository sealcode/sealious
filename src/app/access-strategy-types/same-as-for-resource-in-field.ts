import AccessStrategy from "../../chip-types/access-strategy";
import { App, Context, FieldTypes, Query } from "../../main";
import Collection from "../../chip-types/collection";
import { ActionName } from "../../action";
import SingleItemResponse from "../../../common_lib/response/single-item-response";
import QueryStage from "../../datastore/query-stage";
import DenyAll from "../../datastore/deny-all";
import { AllowAll } from "../../datastore/allow-all";

export default class gSameAsForResourceInField extends AccessStrategy {
	static type_name = "same-as-for-resource-in-field";
	current_collection: string;
	field: string;
	constructor({
		action_name,
		collection_name,
		field,
	}: {
		action_name: ActionName;
		collection_name: string;
		field: string;
	}) {
		super({ action_name, collection_name, field });
		this.current_collection = collection_name;
		this.field = field;
	}

	getCollection(app: App): Collection {
		return app.collections[this.current_collection];
	}

	getReferencedCollection(app: App): Collection {
		return (this.getCollection(app).fields[
			this.field
		] as FieldTypes.SingleReference).get_target_collection();
	}

	getReferencedAccessStrategy(app: App): AccessStrategy {
		return this.getReferencedCollection(app).getAccessStrategy("show");
	}

	async _getRestrictingQuery(context: Context) {
		const referenced_restricting_query = await this.getReferencedAccessStrategy(
			context.app
		).getRestrictingQuery(context);

		if (
			referenced_restricting_query instanceof DenyAll ||
			referenced_restricting_query instanceof AllowAll
		) {
			return referenced_restricting_query;
		}

		const query = new Query();
		const parent_prefix = query.lookup({
			from: this.getReferencedCollection(context.app).name,
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
		if (!response) {
			return null;
		}
		const sealious_response_in_field = await context.app.runAction(
			new context.app.SuperContext(),
			[
				"collections",
				this.getReferencedCollection(context.app).name,
				response[this.field],
			],
			"show"
		);

		return this.getReferencedAccessStrategy(context.app).check(
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
	const ret: { [name: string]: any } = {};
	for (const prop of Object.keys(group) as (keyof typeof group)[]) {
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
		ret[new_prop] = group[prop];
	}

	return ret;
}
