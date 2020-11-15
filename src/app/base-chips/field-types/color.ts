import { Field } from "../../../main";
import ColorParser from "color"; //putting it here not to slow down `new Sealious.app()`

export default class Color extends Field {
	typeName = "color";
	async isProperValue(_: any, new_value: string) {
		try {
			if (typeof new_value === "string") {
				ColorParser(new_value.toLowerCase());
			} else {
				ColorParser(new_value);
			}
			return Field.valid();
		} catch (e) {
			return Field.invalid("couldn't parse the color");
		}
	}

	async encode(_: any, value: string) {
		const color = ColorParser(value);
		return color.hex();
	}

	getTypeName = () => "color";
}
