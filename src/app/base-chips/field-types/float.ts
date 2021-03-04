import { Context, Field } from "../../../main";

/** Stores a floating point number. DOes not take params. Does not allow range filtering. @todo: add range filtering */
export default class Float extends Field {
	typeName = "float";
	async isProperValue(context: Context, input: number) {
		const test = parseFloat(input.toString());
		if (test === null || isNaN(test) || isNaN(input) === true) {
			return Field.invalid(context.app.i18n("invalid_float", [input]));
		} else {
			return Field.valid();
		}
	}
	async encode(_: any, value: number | string) {
		if (value === null) {
			return null;
		}
		const parsed_float = parseFloat(value.toString());
		return parsed_float;
	}
}
