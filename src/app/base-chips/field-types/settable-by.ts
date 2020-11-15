import Field, { HybridField } from "../../../chip-types/field";
import { Context } from "../../../main";
import Policy from "../../../chip-types/policy";

export default class SettableBy<T extends Field> extends HybridField<T> {
	typeName = "settable-by";
	policy: Policy;

	constructor(base_field: T, policy: Policy) {
		super(base_field);
		this.policy = policy;
	}

	async isProperValue(
		context: Context,
		input: Parameters<T["encode"]>[1],
		old_value: Parameters<T["encode"]>[2]
	) {
		const result = await this.policy.check(context);
		if (result && !result.allowed) {
			return Field.invalid(result.reason);
		}
		return this.virtual_field.isProperValue(context, input, old_value);
	}
}
