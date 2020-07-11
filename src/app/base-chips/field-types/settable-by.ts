import Field, {
	HybridField,
	HybridFieldParams,
} from "../../../chip-types/field";
import { Context } from "../../../main";
import AccessStrategy from "../../../chip-types/access-strategy";

export default class SettableBy<T extends Field> extends HybridField<T> {
	getTypeName = () => "settable-by";
	access_strategy: AccessStrategy;

	setParams(
		params: HybridFieldParams<T> & {
			access_strategy: AccessStrategy;
		}
	) {
		super.setParams(params);
		this.access_strategy = params.access_strategy;
	}

	async isProperValue(
		context: Context,
		input: Parameters<T["encode"]>[1],
		old_value: Parameters<T["encode"]>[2]
	) {
		const result = await this.access_strategy.check(context);
		if (result && !result.allowed) {
			return Field.invalid(result.reason);
		}
		return this.virtual_field.isProperValue(context, input, old_value);
	}
}
