import Field, {
	HybridField,
	HybridFieldParams,
} from "../../../chip-types/field";
import { Context } from "../../../main";
import Policy from "../../../chip-types/policy";

export default class SettableBy<T extends Field> extends HybridField<T> {
	getTypeName = () => "settable-by";
	policy: Policy;

	setParams(
		params: HybridFieldParams<T> & {
			policy: Policy;
		}
	) {
		super.setParams(params);
		this.policy = params.policy;
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
