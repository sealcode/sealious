import Field, {
	type ExtractFieldDecoded,
	type ExtractFieldInput,
	type ExtractFieldStorage,
	HybridField,
} from "../../../chip-types/field.js";
import type { CollectionItem, Context } from "../../../main.js";
import type Policy from "../../../chip-types/policy.js";

export default class SettableBy<T extends Field<any, any>> extends HybridField<
	ExtractFieldInput<T>,
	ExtractFieldDecoded<T>,
	ExtractFieldStorage<T>,
	ExtractFieldInput<T>,
	ExtractFieldDecoded<T>,
	ExtractFieldStorage<T>,
	T
> {
	typeName = "settable-by";
	policy: Policy;

	constructor(base_field: T, policy: Policy) {
		super(base_field);
		this.policy = policy;
	}

	async isProperValue(
		context: Context,
		input: Parameters<T["encode"]>[1],
		old_value: Parameters<T["encode"]>[2],
		_blessing: unknown,
		item: CollectionItem | undefined
	) {
		const result = await this.policy.check(
			context,
			item ? async () => item : undefined
		);
		if (result && !result.allowed) {
			return Field.invalid(result.reason);
		}
		return this.virtual_field.checkValue(
			context,
			input,
			old_value,
			null,
			item
		);
	}
}
