import {
	Field,
	Context,
	CollectionItem,
	App,
	Collection,
} from "../../../main.js";
import ItemList, {
	type AttachmentOptions,
} from "../../../chip-types/item-list.js";
import { CachedValue } from "./field-types.js";
import { CollectionRefreshCondition } from "../../event-description.js";
import {
	OpenApiTypeMapping,
	OpenApiTypes,
} from "../../../schemas/open-api-types.js";

export class ListOfIDs extends Field<[]> {
	typeName = "list-of-ids";
	open_api_type = OpenApiTypes.NONE;

	async getOpenApiSchema(): Promise<Record<string, unknown>> {
		return {
			type: "array",
			items: {
				...OpenApiTypeMapping[OpenApiTypes.INT],
			},
		};
	}

	async isProperValue(context: Context) {
		return context.is_super
			? Field.valid()
			: Field.invalid(context.app.i18n("read_only_field"));
	}
}

export default class ReverseSingleReference extends CachedValue<
	string[],
	string[],
	ListOfIDs
> {
	typeName = "reverse-single-reference";
	referencing_field: string;
	referencing_collection: string;

	open_api_type = OpenApiTypes.NONE;

	constructor(params: {
		referencing_field: string;
		referencing_collection: string;
	}) {
		super(new ListOfIDs(), {
			refresh_on: [],
			get_value: (context: Context, item: CollectionItem) => {
				return this.getValueOnChange(context, item);
			},
			initial_value: [],
		});
		this.referencing_field = params.referencing_field;
		this.referencing_collection = params.referencing_collection;
	}

	async init(app: App, collection: Collection) {
		this.refresh_on = [
			new CollectionRefreshCondition(
				this.referencing_collection,
				"after:create",
				async ([, item]) => {
					const ret = [item.get(this.referencing_field) as string];
					this.app.Logger.debug3(
						"REVERSE SINGLE REFERENCE",
						"resource_getter for after create",
						{ ret, item }
					);
					return ret;
				}
			),
			new CollectionRefreshCondition(
				this.referencing_collection,
				"after:remove",
				async ([, item]) => {
					this.app.Logger.debug3(
						"REVERSE SINGLE REFERENCE",
						"handling the after:remove event"
					);
					const search_value =
						this.getValueFromReferencingCollection(item);
					const affected = await this.app.Datastore.find(
						this.collection.name,
						{
							[await this.getValuePath()]: search_value,
						}
					);
					const ret = affected.map(
						(document: { id: string }) => document.id
					);
					this.app.Logger.debug3(
						"REVERSE SINGLE REFERENCE",
						"resource_getter for after delete",
						{ ret }
					);
					return ret;
				}
			),
			new CollectionRefreshCondition(
				this.referencing_collection,
				"after:edit",
				async ([, item]) => {
					if (!item.body.changed_fields.has(this.referencing_field)) {
						this.app.Logger.debug3(
							"REVERSE SINGLE REFERENCE",
							`Update does not concern the ${this.name} field, skipping hook...`
						);
						return [];
					}
					this.app.Logger.debug3(
						"REVERSE SINGLE REFERENCE",
						"started resource_getter for after edit"
					);

					const affected_ids: string[] = Array.from(
						new Set<string>(
							[
								(await item.get(
									this.referencing_field
								)) as string,
								item.original_body.getEncoded(
									this.referencing_field
								) as string,
							].filter(
								(e) => e /* is truthy, not null or undefined*/
							)
						).values()
					);
					this.app.Logger.debug3(
						"REVERSE SINGLE REFERENCE",
						"resource_getter for after edit",
						{ affected_ids }
					);
					return affected_ids;
				}
			),
		];
		super.init(app, collection);
	}

	async getValueOnChange(context: Context, item: CollectionItem) {
		context.app.Logger.debug2("REVERSE SINGLE REFERENCE", "get_value", {
			affected_id: item.id,
		});
		const list = await new ItemList(
			this.getReferencingCollection(),
			context
		)
			.filter({ [this.referencing_field]: item.id })
			.fetch();
		const ret = list.items.map((item) => item.id);
		context.app.Logger.debug2("REVERSE SINGLE REFERENCE", "get_value", {
			affected_id: item.id,
			ret,
		});
		return ret;
	}

	getReferencingCollection() {
		const referencingCollection =
			this.app.collections[this.referencing_collection];

		if (referencingCollection) {
			return referencingCollection;
		} else {
			throw new Error(
				`Referenced colllection is missing: "${this.referencing_collection}"`
			);
		}
	}

	async getMatchQueryValue(context: Context, field_filter: any) {
		if (typeof field_filter !== "object") {
			return {
				$eq: field_filter,
			};
		}

		context.app.Logger.debug3(
			"REVERSE SINGLE REFERENCE",
			"Querying items matching query:",
			field_filter
		);

		const collection = this.app.collections[this.referencing_collection];

		if (!collection) {
			throw new Error("collection is missing");
		}

		const { items } = await collection
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

	async getAttachments(
		context: Context,
		target_id_lists: string[][],
		attachment_options?: AttachmentOptions<any>,
		format: any = {}
	) {
		context.app.Logger.debug2(
			"REVERSE SINGLE REFERENCE",
			"getAttachments",
			target_id_lists
		);
		const merged_ids: string[] = target_id_lists.reduce(
			(a, b) => a.concat(b),
			[]
		);
		const ret = new ItemList<any>(
			this.getReferencingCollection(),
			context
		).ids(merged_ids);
		if (format) {
			ret.format(format);
		}
		if (typeof attachment_options === "object") {
			ret.attach(attachment_options);
		}

		return ret.fetch();
	}

	getValueFromReferencingCollection(item: CollectionItem) {
		// this returns what need to be stored as one of the values in the array
		// that becomes this field's value
		return item.id;
	}
}
