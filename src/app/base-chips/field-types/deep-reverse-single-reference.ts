import ItemList, {
	type AttachmentOptions,
} from "../../../chip-types/item-list.js";
import type Context from "../../../context.js";
import type { App, Collection, CollectionItem } from "../../../main.js";
import ReverseSingleReference from "./reverse-single-reference.js";
import SingleReference from "./single-reference.js";

type Parameters =
	| {
			intermediary_collection: string;
			intermediary_field_that_points_here: string;
			intermediary_field_that_points_there: string;
			target_collection: string;
	  }
	| string;

export class DeepReverseSingleReference extends ReverseSingleReference {
	typeName = "deep-reverse-single-reference";
	intermediary_field_that_points_there: string;
	target_collection: string;
	intermediary_collection: string;

	constructor(params: Parameters) {
		let intermediary_field_that_points_here = "";
		let intermediary_collection = "";
		let intermediary_field_that_points_there = "";
		let target_collection = "";
		if (typeof params === "string") {
			intermediary_collection = params;
		} else {
			intermediary_field_that_points_here =
				params.intermediary_field_that_points_here;
			intermediary_collection = params.intermediary_collection;
			intermediary_field_that_points_there =
				params.intermediary_field_that_points_there;
			target_collection = params.target_collection;
		}

		super({
			referencing_field: intermediary_field_that_points_here,
			referencing_collection: intermediary_collection,
		});
		this.intermediary_field_that_points_there =
			intermediary_field_that_points_there;
		this.target_collection = target_collection;
		this.intermediary_collection = intermediary_collection;
	}

	async init(app: App, collection: Collection): Promise<void> {
		if (this.intermediary_collection && !this.target_collection) {
			const orgin_collection = collection.name;

			const intermediary_collection_instance =
				app.collections[this.intermediary_collection];
			const intermediary_fields = intermediary_collection_instance.fields;
			const intermediary_collection_fields =
				Object.values(intermediary_fields);

			const fields_from_origin_collection =
				intermediary_collection_fields.filter(
					(fld: SingleReference) =>
						fld instanceof SingleReference &&
						fld.target_collection === orgin_collection
				) as SingleReference[];
			const fields_from_target_collection =
				intermediary_collection_fields.filter(
					(fld: SingleReference) =>
						fld instanceof SingleReference &&
						fld.target_collection !== orgin_collection
				) as SingleReference[];

			if (
				fields_from_origin_collection.length !== 1 ||
				fields_from_target_collection.length !== 1
			) {
				throw new Error(
					"Couldn't match intermediary fields automatically. Please provide detailed configuration or clear intermediary collection."
				);
			}

			const intermediary_field_that_points_here = Object.keys(
				intermediary_fields
			).find(
				(key) =>
					intermediary_fields[key] ===
					fields_from_origin_collection[0]
			);
			const intermediary_field_that_points_there = Object.keys(
				intermediary_fields
			).find(
				(key) =>
					intermediary_fields[key] ===
					fields_from_target_collection[0]
			);

			if (
				!intermediary_field_that_points_here ||
				!intermediary_field_that_points_there
			) {
				throw new Error(
					"Runtime error. `intermediary_field_that_points_here` and `intermediary_field_that_points_there` could not be resolved."
				);
			}

			this.target_collection =
				fields_from_target_collection[0].target_collection;
			this.intermediary_field_that_points_there =
				intermediary_field_that_points_there;
			this.referencing_field = intermediary_field_that_points_here;
		}

		super.init(app, collection);
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
		attachment_options?: AttachmentOptions<any>,
		format: any = {}
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
		if (format) {
			ret.format(format);
		}
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
