import { Context, Field } from "../../../main.js";
import { OpenApiTypes } from "../../../schemas/open-api-types.js";

export default class ContextField extends Field<
	Context,
	Context,
	Record<string, unknown>
> {
	typeName = "context";

	open_api_type = OpenApiTypes.NONE;

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
