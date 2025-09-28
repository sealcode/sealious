import { Field, Context } from "../../../main.js";
import { HybridField } from "../../../chip-types/field.js";

export default class DisallowUpdate<
	DecodedType,
	InputType,
	StorageType,
	T extends Field<DecodedType, InputType, StorageType>,
> extends HybridField<
	DecodedType,
	InputType,
	StorageType,
	DecodedType,
	InputType,
	StorageType,
	T
> {
	typeName = "disallow-update";
	async isProperValue(
		context: Context,
		new_value: Parameters<T["checkValue"]>[1],
		old_value?: Parameters<T["checkValue"]>[2],
		new_value_blessing_token: symbol | null = null
	) {
		context.app.Logger.debug3(
			"DISALLOW-UPDATE",
			"Checking if this field already has a value",
			{ new_value, old_value }
		);
		if (old_value === undefined) {
			return this.virtual_field.checkValue(
				new context.app.SuperContext(),
				new_value,
				old_value,
				new_value_blessing_token
			);
		}
		return Field.invalid(
			context.i18n`You cannot change a previously set value.`
		);
	}
}
