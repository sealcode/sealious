import { Field, Context } from "../../../main";
import ItemList, { AttachmentOptions } from "../../../chip-types/item-list";
import { CachedValue } from "./field-types";
import { EventDescription } from "../../delegate-listener";

class ListOfIDs extends Field {
	typeName: "list-of-ids";
	async isProperValue(context: Context, _: any) {
		return context.is_super
			? Field.valid()
			: Field.invalid(context.app.i18n("read_only_field"));
	}
}

export default class ReverseSingleReference extends CachedValue<ListOfIDs> {
	typeName = "reverse-single-refernce";
	referencing_field: string;
	referencing_collection: string;

	constructor(params: {
		referencing_field: string;
		referencing_collection: string;
	}) {
		super(new ListOfIDs(), {
			refresh_on: [
				{
					event: new EventDescription(
						params.referencing_collection,
						"after:create"
					),
					resource_id_getter: async (context, item) => {
						this.app.Logger.debug3(
							"REVERSE SINGLE REFERENCE",
							"resource_getter for after create",
							{
								item,
								referencing_field: this.referencing_field,
								referencing_collection: this
									.referencing_collection,
							}
						);
						const ret_id = await item.getDecoded(
							params.referencing_field,
							context
						);
						if (typeof ret_id !== "string") {
							throw new Error(
								`Expected the id to be a string, got: ${typeof ret_id}`
							);
						}
						const ret = [ret_id];
						this.app.Logger.debug3(
							"REVERSE SINGLE REFERENCE",
							"resource_getter for after create",
							{ ret, item }
						);
						return ret;
					},
				},
				{
					event: new EventDescription(
						params.referencing_collection,
						"after:remove"
					),
					resource_id_getter: async (_, item) => {
						const deleted_id = item.id;
						const affected = await this.app.Datastore.find(
							this.collection.name,
							{
								[await this.getValuePath()]: deleted_id,
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
					},
				},
				{
					event: new EventDescription(
						params.referencing_collection,
						"after:edit"
					),
					resource_id_getter: async (_, item) => {
						if (
							!item.body.changed_fields.has(
								this.referencing_field
							)
						) {
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
									(e) =>
										e /* is truthy, not null or undefined*/
								)
							).values()
						);
						this.app.Logger.debug3(
							"REVERSE SINGLE REFERENCE",
							"resource_getter for after edit",
							{ affected_ids }
						);
						return affected_ids;
					},
				},
			],
			get_value: async (context: Context, resource_id: string) => {
				context.app.Logger.debug2(
					"REVERSE SINGLE REFERENCE",
					"get_value",
					{
						affected_id: resource_id,
						referencing_collection: this.getReferencingCollection()
							.name,
						collection: this.collection.name,
					}
				);
				const list = await new ItemList(
					this.getReferencingCollection(),
					context
				)
					.filter({ [this.referencing_field]: resource_id })
					.fetch();
				const ret = list.items.map((item) => item.id);
				context.app.Logger.debug2(
					"REVERSE SINGLE REFERENCE",
					"get_value",
					{ affected_id: resource_id, ret }
				);
				return ret;
			},
			initial_value: [],
		});
		this.referencing_field = params.referencing_field;
		this.referencing_collection = params.referencing_collection;
	}

	getReferencingCollection() {
		return this.app.collections[this.referencing_collection];
	}

	async filterToQuery(context: Context, field_filter: any) {
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
		const { items } = await this.app.collections[
			this.referencing_collection
		]
			.list(context)
			.filter(field_filter)
			.fetch();
		return {
			$in: items.map((resource) => resource.id),
		};
	}

	async getAttachments(
		context: Context,
		target_id_lists: string[][],
		attachment_options?: AttachmentOptions<any>
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
		if (typeof attachment_options === "object") {
			ret.attach(attachment_options);
		}
		return ret.fetch();
	}
}
