import { Field } from "../../../main";

const uuid = require("node-uuid").v4;

export default class SessionID extends Field {
	typeName = "session-id";

	async isProperValue() {
		return Field.valid();
	}

	async encode(_: any, input: string | null) {
		return input ? input : uuid();
	}

	async getDefaultValue(_: any) {
		return uuid();
	}
}
