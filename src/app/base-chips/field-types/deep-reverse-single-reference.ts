import ItemList, { AttachmentOptions } from "../../../chip-types/item-list.js";
import type Context from "../../../context.js";
import type { CollectionItem } from "../../../main.js";
import ReverseSingleReference from "./reverse-single-reference.js";

export class DeepReverseSingleReference extends ReverseSingleReference {
	typeName = "deep-reverse-single-reference";
	intermediary_field_that_points_there: string;
	target_collection: string;

	constructor({
		intermediary_collection,
		intermediary_field_that_points_here,
		intermediary_field_that_points_there,
		target_collection,
	}: {
		intermediary_collection: string;
		intermediary_field_that_points_here: string;
		intermediary_field_that_points_there: string;
		target_collection: string;
	}) {
		super({
			referencing_field: intermediary_field_that_points_here,
			referencing_collection: intermediary_collection,
		});
		this.intermediary_field_that_points_there =
			intermediary_field_that_points_there;
		this.target_collection = target_collection;
	}

	getReferencingCollection() {
		return this.app.collections[this.referencing_collection];
	}

	async getMatchQueryValue(context: Context, field_filter: any) {
		if (typeof field_filter !== "object") {
			return {
				$eq: field_filter,
			};
		}
		context.app.Logger.debug3(
			"DEEP REVERSE SINGLE REFERENCE",
			"Querying items matching query:",
			field_filter
		);
		const { items } = await this.app.collections[this.target_collection]
			.list(context)
			.filter(field_filter)
			.fetch();
		return {
			$in: items.map((resource) => resource.id),
		};
	}

	async getMatchQuery(context: Context, filter: any) {
		return {
			[await this.getValuePath()]: await this.getMatchQueryValue(
				context,
				filter
			),
		};
	}

	getTargetCollection() {
		return this.app.collections[this.target_collection];
	}

	async getAttachments(
		context: Context,
		target_id_lists: string[][],
		attachment_options?: AttachmentOptions<any>
	) {
		context.app.Logger.debug2(
			"DEEP REVERSE SINGLE REFERENCE",
			"getAttachments",
			target_id_lists
		);
		const merged_ids: string[] = target_id_lists.reduce(
			(a, b) => a.concat(b),
			[]
		);
		const ret = new ItemList<any>(this.getTargetCollection(), context).ids(
			merged_ids
		);
		if (typeof attachment_options === "object") {
			ret.attach(attachment_options);
		}
		return ret.fetch();
	}

	async getValueOnChange(context: Context, item: CollectionItem) {
		context.app.Logger.debug2(
			"DEEP REVERSE SINGLE REFERENCE",
			"get_value",
			{
				affected_id: item.id,
			}
		);
		const list = await new ItemList(
			this.getReferencingCollection(),
			context
		)
			.filter({ [this.referencing_field]: item.id })
			.fetch();
		const ret = list.items.map((item) =>
			item.get(this.intermediary_field_that_points_there)
		);
		context.app.Logger.debug2(
			"DEEP REVERSE SINGLE REFERENCE",
			"get_value",
			{
				affected_id: item.id,
				ret,
			}
		);
		return ret;
	}

	getValueFromReferencingCollection(item: CollectionItem) {
		// this returns what need to be stored as one of the values in the array
		// that becomes this field's value
		return item.get(this.intermediary_field_that_points_there) as string;
	}
}
