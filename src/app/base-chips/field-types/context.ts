import { Context, Field } from "../../../main.js";

export default class ContextField extends Field<
	Context,
	Context,
	Record<string, unknown>
> {
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
