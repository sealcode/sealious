import Field from "../../../chip-types/field";
import { Context } from "../../../main";

export default class ValueExistingInCollection extends Field {
	getTypeName = () => "value-existing-in-collection";
	get_field: () => Field;
	include_forbidden: boolean;

	async isProperValue(
		context: Context,
		new_value: Parameters<
			ReturnType<this["get_field"]>["isProperValue"]
		>[1],
		old_value: Parameters<ReturnType<this["get_field"]>["isProperValue"]>[2]
	) {
		const field = this.get_field();
		const collection = field.collection;
		const result = await field.isProperValue(context, new_value, old_value);
		if (!result.valid) {
			return result;
		}
		if (this.include_forbidden) {
			context = new this.app.SuperContext();
		}
		const sealious_response = await this.app.runAction(
			context,
			["collections", collection.name],
			"show",
			{
				filter: { [field.name]: new_value },
			}
		);
		if (sealious_response.empty) {
			return Field.invalid(
				`No ${collection.name} with ${field.name} set to ${new_value}`
			);
		}
		return Field.valid();
	}

	setParams(params: { field: () => Field; include_forbidden: boolean }) {
		this.get_field = params.field;
		this.include_forbidden = params.include_forbidden;
	}

	encode(...args: Parameters<ReturnType<this["get_field"]>["encode"]>) {
		return this.get_field().encode(
			...(args as Parameters<Field["encode"]>)
		);
	}

	decode(...args: Parameters<ReturnType<this["get_field"]>["decode"]>) {
		return this.get_field().decode(
			...(args as Parameters<Field["decode"]>)
		);
	}

	filterToQuery(
		...args: Parameters<ReturnType<this["get_field"]>["filterToQuery"]>
	) {
		return this.get_field().filterToQuery(
			...(args as Parameters<Field["filterToQuery"]>)
		);
	}

	getAggregationStages(
		...args: Parameters<
			ReturnType<this["get_field"]>["getAggregationStages"]
		>
	) {
		return this.get_field().getAggregationStages(
			...(args as Parameters<Field["getAggregationStages"]>)
		);
	}
}
