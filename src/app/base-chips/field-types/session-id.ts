import { Field } from "../../../main";

const uuid = require("node-uuid").v4;

export default class SessionID extends Field {
	getTypeName = () => "session-id";

	async isProperValue() {
		return Field.valid();
	}

	async encode(_: any, input: string) {
		return input ? input : uuid();
	}
}
