import { Field, Context } from "../../../main";

const uuid = require("node-uuid").v4;

export default class SecretToken extends Field {
	typeName = "secret-token";

	isOldValueSensitive = () => true;

	async isProperValue() {
		return Field.valid();
	}

	async encode(_: Context, __: any, old_value: string) {
		return old_value ? old_value : uuid();
	}

	async decode(context: Context, value: string) {
		return context.is_super ? value : "it's a secret to everybody";
	}

	async filterToQuery(context: Context, filter: any) {
		if (context.is_super) {
			return { $eq: filter };
		} else {
			return { $eq: "nice try" };
		}
	}
}
