import { predicates } from "@sealcode/ts-predicates";
import type Field from "../../../chip-types/field.js";
import { Context, Fieldset, FieldsetInput } from "../../../main.js";
import { ArrayStorage } from "./array-storage.js";

export class StructuredArray<
	Subfields extends Record<string, Field<any>>
> extends ArrayStorage<FieldsetInput<Subfields>> {
	typeName = "structured-array";
	constructor(public subfields: Subfields) {
		super(predicates.object);
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
