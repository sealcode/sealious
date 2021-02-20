import { Field } from "../../../main";

import { v4 as uuid } from "uuid";

export default class SessionID extends Field {
	typeName = "session-id";

	async isProperValue() {
		return Field.valid();
	}

	async encode(_: any, input: string | null) {
		if (input === null) {
			return null;
		}
		return input ? input : uuid();
	}

	async getDefaultValue(_: any) {
		return uuid();
	}
}
