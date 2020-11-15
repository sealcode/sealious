import { Context, Field } from "../../../main";

export default class ContextField extends Field {
	typeName = "context";
	async isProperValue(_: Context, value: Context) {
		if (value instanceof Context) {
			return Field.valid();
		} else {
			return Field.invalid(
				"Provided value is not an instance of Sealious.Context"
			);
		}
	}

	async encode(_: Context, value: Context | null) {
		if (value === null) {
			return null;
		}
		return value.toDBEntry();
	}
}
