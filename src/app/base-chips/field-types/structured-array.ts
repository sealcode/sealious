import { predicates } from "@sealcode/ts-predicates";
import type Field from "../../../chip-types/field.js";
import { ArrayStorage } from "./array-storage.js";
import { OpenApiTypes } from "../../../schemas/open-api-types.js";
import { Fieldset, type FieldsetInput } from "../../../chip-types/fieldset.js";
import type Context from "../../../context.js";
import Collection from "../../../chip-types/collection.js";
import type { App } from "../../app.js";
import { ItemListResult } from "../../../chip-types/item-list-result.js";
import type CollectionItem from "../../../chip-types/collection-item.js";

export class StructuredArray<
	Subfields extends Record<string, Field<unknown>>,
> extends ArrayStorage<FieldsetInput<Subfields>> {
	typeName = "structured-array";

	open_api_type = OpenApiTypes.NONE; // array - custom type generation

	async getOpenApiSchema(context: Context): Promise<Record<string, unknown>> {
		return {
			type: "array",
			items: await Collection.getOpenApiSubfieldsSchema(
				context,
				this.subfields
			),
		};
	}

	constructor(public subfields: Subfields) {
		super(predicates.object);
	}

	async init(app: App, collection: Collection): Promise<void> {
		await super.init(app, collection);
		await Promise.all(
			Object.values(this.subfields).map((subfield) =>
				subfield.init(app, collection)
			)
		);
	}

	async getEmptyElement() {
		return {} as FieldsetInput<Subfields>;
	}

	async isProperElement(
		context: Context,
		element: unknown,
		index: number,
		item: CollectionItem | undefined
	): Promise<{ valid: boolean; reason: string }> {
		const orig_result = await super.isProperElement(
			context,
			element,
			index,
			item
		);
		if (!orig_result.valid) {
			return orig_result;
		}

		const obj = element as FieldsetInput<Subfields>;
		const fieldset = new Fieldset(this.subfields);
		fieldset.setMultiple(obj as any);

		const result = await fieldset.validate(
			context,
			new Fieldset(this.subfields),
			true,
			item
		);
		if (result.valid) {
			return { valid: true, reason: "no validation errors" };
		} else {
			return {
				valid: false,
				reason: JSON.stringify(
					Object.fromEntries(
						Object.entries(result.errors).map(([key, value]) => [
							`[${index}]${key}`,
							value,
						])
					)
				),
			};
		}
	}

	getPostgreSqlFieldDefinitions(): string[] {
		return [`"${this.name}" JSONB[]`];
	}

	async getAttachments(
		context: Context,
		values: any[], // this method gets called once for multiple resources, to limit the number of queries. Field values of all the resources are passed in this array
		attachment_options: Record<string, unknown>,
		format_params: any
	): Promise<ItemListResult<any>> {
		let all_items: CollectionItem<any>[] = [];
		if (!attachment_options) {
			return new ItemListResult([], [], {});
		}
		for (const [subfield_name, subfield] of Object.entries(
			this.subfields
		)) {
			if (!(subfield_name in attachment_options)) {
				continue;
			}
			const { items: new_items } = await subfield.getAttachments(
				context,
				(values as { [subfield_name]: string }[][])
					.flat()
					.map((value) => value[subfield_name]),
				attachment_options?.[subfield_name] || {},
				format_params?.[subfield_name] || null
			);
			all_items = [...all_items, ...new_items];
		}
		return new ItemListResult(all_items, [], {});
	}

	getAttachmentIDs(value: FieldsetInput<Subfields>[]): string[] {
		let all_ids: string[] = [];
		for (const [subfield_name, subfield] of Object.entries(
			this.subfields
		)) {
			const new_ids = value
				.map(
					(entry) =>
						entry[subfield_name as keyof FieldsetInput<Subfields>]
				)
				.map((value) => subfield.getAttachmentIDs(value))
				.flat();
			all_ids = [...all_ids, ...new_ids];
		}
		return all_ids;
	}
}
