import { Field } from "../../../main.js";

import { nanoid } from "nanoid";

export default class ShortID extends Field<string> {
	typeName = "shortid";
	hasIndex = async () => true;

	async isProperValue() {
		return Field.valid();
	}

	async encode(_: any, input: string | null) {
		if (input === null) {
			return null;
		}
		return input ? input : nanoid();
	}
}
