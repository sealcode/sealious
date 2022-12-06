import { is, predicates } from "@sealcode/ts-predicates";
import type { ValidationResult } from "../../../chip-types/field";
import type Field from "../../../chip-types/field";
import type context from "../../../context";
import { ArrayStorage } from "./array-storage";

export class StructuredArray<
	Subfields extends Record<string, Field>
> extends ArrayStorage<Record<string, unknown>> {
	constructor(public subfields: Record<string, Field>) {
		super(predicates.object);
	}

	async isProperValue(
		context: context,
		new_value: unknown,
		old_value: unknown,
		new_value_blessing_token: symbol | null
	): Promise<ValidationResult> {
		if (!is(new_value, predicates.object)) {
			return { valid: false, reason: `${new_value} is not an object` };
		}
	}
}
