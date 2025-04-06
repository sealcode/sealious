import { Field } from "../../../main.js";

import { OpenApiTypes } from "../../../schemas/open-api-types.js";

import { nanoid } from "nanoid";

export default class ShortID extends Field<string> {
	typeName = "shortid";

	open_api_type = OpenApiTypes.STR;

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
