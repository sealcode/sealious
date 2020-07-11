import Field, {
	ExtractParams,
	ExtractInput,
	ExtractFormatParams,
	Depromisify,
	FieldClass,
} from "./field";

import Context from "../context";

export type HybridFieldParams<T extends Field> = {
	base_field_type: FieldClass<T>;
	base_field_params?: ExtractParams<T>;
};

/*

A hybrid field is one that takes a field type as a param. All
uncustomized methods should be taken from that given field type

*/

export default abstract class HybridField<T extends Field> extends Field<
	ExtractInput<T>,
	ExtractFormatParams<T>
> {
	virtual_field: T;

	setParams(params: HybridFieldParams<T>) {
		this.virtual_field = new params.base_field_type(
			this.app,
			this.collection,
			this.name,
			false,
			{}
		);
		this.virtual_field.setParams(params.base_field_params || {});
	}

	async encode(
		context: Context,
		value: Parameters<T["encode"]>[1],
		old_value?: Parameters<T["encode"]>[2]
	) {
		return this.virtual_field.encode(context, value, old_value);
	}

	async filterToQuery(context: Context, filter: any) {
		return this.virtual_field.filterToQuery(context, filter);
	}

	async isProperValue(
		context: Context,
		new_value: Parameters<T["isProperValue"]>[1],
		old_value: Parameters<T["isProperValue"]>[2]
	) {
		return this.virtual_field.isProperValue(context, new_value, old_value);
	}

	async decode(
		context: Context,
		decoded_value: Depromisify<ReturnType<this["encode"]>>,
		old_value: Parameters<T["decode"]>[2],
		format: Parameters<T["decode"]>[3]
	) {
		return this.virtual_field.decode(
			context,
			decoded_value,
			old_value,
			format
		);
	}
}
