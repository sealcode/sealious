import type { ActionName } from "../../action.js";
import type Collection from "../../chip-types/collection.js";
import Policy from "../../chip-types/policy.js";
import { AllowAll } from "../../datastore/allow-all.js";
import DenyAll from "../../datastore/deny-all.js";
import type QueryStage from "../../datastore/query-stage.js";
import {
	App,
	CollectionItem,
	Context,
	Field,
	FieldTypes,
	Query,
} from "../../main.js";

export default class SameAsForResourceInField extends Policy {
	static type_name = "same-as-for-resource-in-field";
	current_collection: string;
	field: string;
	action_name: ActionName;
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
		this.action_name = action_name;
		this.field = field;
	}

	getCollection(app: App): Collection {
		return app.collections[this.current_collection];
	}

	getReferencedCollection(context: Context): Collection {
		const field = this.getField(context);
		return field instanceof FieldTypes.SingleReference
			? field.getTargetCollection(context)
			: (
					field as FieldTypes.ReverseSingleReference
			  ).getReferencingCollection();
	}

	getReferencedPolicy(context: Context): Policy {
		return this.getReferencedCollection(context).getPolicy(
			this.action_name
		);
	}

	getField(context: Context): Field<unknown> {
		const collection = this.getCollection(context.app);
		const ret = collection.fields[this.field];
		if (!ret) {
			throw new Error(
				`Cannot find field '${this.field}' in collection '${collection.name}'. Perhaps it's a typo?`
			);
		}
		return ret;
	}

	async _getRestrictingQuery(context: Context) {
		const referenced_restricting_query = await this.getReferencedPolicy(
			context
		).getRestrictingQuery(context);

		if (
			referenced_restricting_query instanceof DenyAll ||
			referenced_restricting_query instanceof AllowAll
		) {
			return referenced_restricting_query;
		}

		const query = new Query();
		let parent_prefix: string;

		if (this.getField(context) instanceof FieldTypes.SingleReference) {
			parent_prefix = query.lookup({
				from: this.getReferencedCollection(context).name,
				localField: this.field,
				foreignField: "id",
			});
		} else {
			//assuming ReverseSingleReference;
			parent_prefix = query.lookup({
				from: this.getReferencedCollection(context).name,
				let: { value: `$${this.field}.value` },
				pipeline: [{ $match: { $expr: { $in: ["$id", "$$value"] } } }],
			});
		}

		const referenced_restricting_pipeline = referenced_restricting_query
			.prefix(parent_prefix)
			.toPipeline();

		const keep_fields: Record<string, Record<"$first", string>> = {
			id: { $first: `$id` },
		}; // this object will help preserve the original fields after $group stage, which serves as a reverse to $unwind
		for (const field_name in this.getCollection(context.app).fields) {
			keep_fields[field_name] = { $first: `$${field_name}` };
		}
		const pipeline: QueryStage[] = [
			...query.toPipeline(),
			{ $unwind: parent_prefix },
			...referenced_restricting_pipeline,
			{
				$group: {
					_id: "$_id",
					[parent_prefix]: {
						$push: `$${parent_prefix}`,
					},
					...keep_fields,
				},
			},
		];

		return Query.fromCustomPipeline(pipeline);
	}

	async checkerFunction(
		context: Context,
		item_getter: () => Promise<CollectionItem>
	) {
		if (!item_getter) {
			return null;
		}
		const item: CollectionItem = await item_getter();

		const field = await item.getDecoded(this.field, context);

		const response = this.getReferencedCollection(context).suGetByID(
			field as string
		);

		const ret = await this.getReferencedPolicy(context).check(
			context,
			() => response
		);
		return ret;
	}

	async isItemSensitive(context: Context) {
		return this.getReferencedPolicy(context).isItemSensitive(context);
	}
}
