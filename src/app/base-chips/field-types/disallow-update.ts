import { HybridField, Field, Context, SuperContext } from "../../../main";

export default class DisallowUpdate<T extends Field> extends HybridField<T> {
	getTypeName = () => "disallow-update";
	async isProperValue(
		context: Context,
		new_value: Parameters<T["isProperValue"]>[1],
		old_value?: Parameters<T["isProperValue"]>[2]
	) {
		if (old_value === undefined) {
			return this.virtual_field.isProperValue(
				new SuperContext(context),
				new_value,
				old_value
			);
		}
		return Field.invalid("You cannot change a previously set value");
	}
}
