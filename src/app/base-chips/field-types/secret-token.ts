import { Field, Context } from "../../../main.js";

import { v4 as uuid } from "uuid";

export default class SecretToken extends Field {
	typeName = "secret-token";

	isOldValueSensitive = () => true;

	async isProperValue() {
		return Field.valid();
	}

	async encode(_: Context, __: any, old_value: string) {
		const ret = old_value ? old_value : uuid();
		return ret;
	}

	async decode(context: Context, value: string) {
		return context.is_super ? value : "it's a secret to everybody";
	}

	async getMatchQueryValue(context: Context, filter: unknown) {
		if (context.is_super) {
			return { $eq: filter };
		} else {
			return { $eq: "nice try" };
		}
	}

	async getDefaultValue() {
		return uuid();
	}
}
