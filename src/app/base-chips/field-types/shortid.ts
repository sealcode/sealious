import { Field } from "../../../main";

import shortid from "shortid";

export default class ShortID extends Field {
	typeName = "shortid";
	hasIndex = () => true;

	async isProperValue() {
		return Field.valid();
	}

	async encode(_: any, input: string | null) {
		return input ? input : shortid.generate();
	}
}
