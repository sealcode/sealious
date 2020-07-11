import ValueExistingInCollection from "./value-existing-in-collection";
import { Context, Field } from "../../../main";

export default class ValueNotExistingInCollection extends ValueExistingInCollection {
	getTypeName = () => "value-not-existing-in-collection";
	async isProperValue(
		context: Context,
		new_value: Parameters<
			ReturnType<this["get_field"]>["isProperValue"]
		>[1],
		old_value: Parameters<ReturnType<this["get_field"]>["isProperValue"]>[2]
	) {
		const field = this.get_field();
		await field.isProperValue(context, new_value, old_value);
		if (this.include_forbidden) {
			context = new this.app.SuperContext();
		}
		const sealious_response = await this.app.runAction(
			context,
			["collections", field.collection.name],
			"show",
			{ filter: { [field.name]: new_value } }
		);
		if (!sealious_response.empty) {
			return Field.invalid(
				`Collection ${field.collection.name} already has a record with '${field.name}' set to '${new_value}'`
			);
		}
		return Field.valid();
	}
}
