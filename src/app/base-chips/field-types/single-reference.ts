import { Field, Context } from "../../../main.js";
import ItemList, {
	type AttachmentOptions,
} from "../../../chip-types/item-list.js";
import { ValidationError } from "../../../response/errors.js";
import { OpenApiTypes } from "../../../schemas/open-api-types.js";

type InnerFilter = Record<string, any>;
type SearchFilter = InnerFilter | string;

/** A reference to other item, in the same or other collection. Can point at items from only one, specified collection. Items with field of this type can be filtered by fields of the items it points at. Examples below.
 *
 */

export default class SingleReference extends Field<string, string> {
	typeName = "single-reference";
	hasIndex = async () => true;
	target_collection: string;
	filter: InnerFilter;

	open_api_type = OpenApiTypes.NONE; // custom - another field reference

	async getOpenApiSchema(): Promise<Record<string, unknown>> {
		return {
			$ref: "#/components/schemas/" + this.target_collection,
		};
	}

	constructor(target_collection: string, filter?: InnerFilter) {
		super();
		this.target_collection = target_collection;
		this.filter = filter || {};
	}

	getTargetCollection(context: Context) {
		const targetCollection =
			context.app.collections[this.target_collection];
		if (targetCollection) {
			return targetCollection;
		} else {
			throw new Error("target collection is missing");
		}
	}

	async isProperValue(context: Context, input: string) {
		context.app.Logger.debug2("SINGLE REFERENCE", "isProperValue?", input);
		const filter = this.filter || {};
		if (input === "") {
			return Field.valid();
		}

		let stages = await this.getTargetCollection(context)
			.list(context)
			.filter(filter)
			.getAggregationStages();
		stages = [{ $match: { id: input } }, ...stages];
		const results = await this.app.Datastore.aggregate(
			this.getTargetCollection(context).name,
			stages
		);

		context.app.Logger.debug3(
			"SINGLE REFERENCE",
			"isProperValue/results",
			results
		);

		const decision =
			results.length > 0
				? Field.valid()
				: Field.invalid(
						context.i18n`You don't have access to specified resource from collection '${this.getTargetCollection(context).name}' or it's absent.`
					);

		context.app.Logger.debug2(
			"SINGLE REFERENCE",
			"isProperValue/decision",
			decision
		);
		return decision;
	}

	async getMatchQueryValue(context: Context, filter: SearchFilter) {
		// treating filter as a query here
		context.app.Logger.debug3("SINGLE REFERENCE", "FiltertoQuery", {
			context,
			filter,
		});
		if (typeof filter !== "object") {
			return {
				$eq: filter,
			};
		}

		const collection = this.app.collections[this.target_collection];
		if (!collection) {
			throw new Error(
				`collection is missing: "${this.target_collection}"`
			);
		}
		const { items } = await collection.list(context).filter(filter).fetch();
		return { $in: items.map((resource) => resource.id) };
	}

	async getAggregationStages(context: Context, filter_value: unknown) {
		context.app.Logger.debug3("SINGLE REFERENCE", "getAggregationStages", {
			context,
			filter_value,
		});
		let filter: { [field_name: string]: any } = {};
		const temp_field_name = `${
			this.getTargetCollection(context).name
		}-lookup${Math.floor(Math.random() * Math.pow(10, 7))}`;
		if (filter_value === null) {
			return [
				{
					$match: {
						$or: [
							{ [await this.getValuePath()]: "" },
							{ [await this.getValuePath()]: null },
							{ [await this.getValuePath()]: { $exists: false } },
						],
					},
				},
			];
		}
		if (
			!filter_value ||
			Object.keys(filter_value as SearchFilter).length === 0
		) {
			return [];
		}
		if (typeof filter_value === "string") {
			return [{ $match: { [await this.getValuePath()]: filter_value } }];
		}
		if (filter_value instanceof Array) {
			let _in = filter_value;
			if (filter_value[0] instanceof Array) _in = filter_value[0];
			return [
				{
					$match: {
						[await this.getValuePath()]: { $in: _in },
					},
				},
			];
		}
		if (typeof filter_value !== "object") {
			throw new ValidationError("Invalid filter value");
		}

		const match_pipeline_entries_promises = [];
		for (const field_name in filter_value) {
			const field = this.getTargetCollection(context).fields[field_name];
			if (!field) {
				return Promise.reject(
					"Unknown field in filter for '" +
						this.getTargetCollection(context).name +
						"': " +
						field_name
				);
			}
			match_pipeline_entries_promises.push(
				field
					.getMatchQuery(
						context,
						filter_value[field_name as keyof typeof filter_value],
						await field.getValuePath()
					)
					.then((query) => ({ $match: query }))
			);
		}

		const entries = await Promise.all(
			Object.entries(filter).map(async ([key, value]) => {
				const resolvedValue = await value;
				return [key, resolvedValue];
			})
		);

		filter = Object.fromEntries(entries);

		const match_pipeline_entries = await Promise.all(
			match_pipeline_entries_promises
		);

		const ret = [
			{
				$lookup: {
					from: this.getTargetCollection(context).name,
					let: { referenced_id: `$${await this.getValuePath()}` },
					pipeline: [
						{
							$match: {
								$expr: {
									$eq: ["$id", "$$referenced_id"],
								},
							},
						},
						{ $match: filter },
						...match_pipeline_entries,
						{ $count: "count" },
					],
					as: temp_field_name,
				},
			},
			{ $match: { [`${temp_field_name}.count`]: { $gt: 0 } } },
			{ $unset: temp_field_name },
		];

		return ret;
	}

	async getAttachments(
		context: Context,
		target_ids: string[],
		attachment_options?: AttachmentOptions<any>
	) {
		const ret = new ItemList<any>(
			this.getTargetCollection(context),
			context
		);
		if (attachment_options) {
			// ^ is either a boolean or an object
			ret.ids(target_ids);
			if (typeof attachment_options === "object") {
				ret.attach(attachment_options);
			}
		} else {
			ret.ids([]); // return an empty list;
		}
		return ret.fetch();
	}

	getAttachmentIDs(value: string): string[] {
		return [value];
	}
}
