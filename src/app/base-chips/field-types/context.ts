import { Context, Field } from "../../../main";

export default class ContextField extends Field {
	typeName = "context";
	async isProperValue(context: Context, value: Context) {
		if (value instanceof Context) {
			return Field.valid();
		} else {
			return Field.invalid(context.app.i18n("invalid_context"));
		}
	}

	async encode(_: Context, value: Context | null) {
		if (value === null) {
			return null;
		}
		return value.toDBEntry();
	}
}
