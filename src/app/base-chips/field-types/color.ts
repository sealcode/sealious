import { Context, Field } from "../../../main.js";
import ColorParser from "color"; //putting it here not to slow down `new Sealious.app()`
import { OpenApiTypes } from "../../../schemas/open-api-types.js";

export default class Color extends Field<string> {
	typeName = "color";

	open_api_type = OpenApiTypes.STR;

	async isProperValue(context: Context, new_value: string) {
		try {
			if (typeof new_value === "string") {
				ColorParser(new_value.toLowerCase());
			} else {
				ColorParser(new_value);
			}
			return Field.valid();
		} catch (e) {
			return Field.invalid(context.app.i18n("invalid_color"));
		}
	}

	async encode(_: any, value: string | null) {
		if (value === null) {
			return null;
		}
		const color = ColorParser(value);
		return color.hex();
	}

	getTypeName = () => "color";

	getPostgreSqlFieldDefinitions(): string[] {
		return [`"${this.name}" VARCHAR`];
	}
}
