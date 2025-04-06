import { predicates } from "@sealcode/ts-predicates";
import type Field from "../../../chip-types/field.js";
import {
	App,
	Collection,
	Context,
	Fieldset,
	type FieldsetInput,
} from "../../../main.js";
import { ArrayStorage } from "./array-storage.js";
import { OpenApiTypes } from "../../../schemas/open-api-types.js";

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
		index: number
	): Promise<{ valid: boolean; reason: string }> {
		const orig_result = await super.isProperElement(
			context,
			element,
			index
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
			true
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
}
