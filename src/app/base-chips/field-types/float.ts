import { Field } from "../../../main";

export default class Float extends Field<number | string, number> {
	getTypeName = () => "float";
	async isProperValue(_: any, input: number) {
		const test = parseFloat(input.toString());
		if (test === null || isNaN(test) || isNaN(input) === true) {
			return Field.invalid(
				`Value '${input}' is not a float number format.`
			);
		} else {
			return Field.valid();
		}
	}
	async encode(_: any, value_in_code: number | string) {
		const parsed_float = parseFloat(value_in_code.toString());
		return parsed_float;
	}
}
