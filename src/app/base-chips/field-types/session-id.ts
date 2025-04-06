import { Context, Field } from "../../../main.js";

import { v4 as uuid } from "uuid";
import { OpenApiTypes } from "../../../schemas/open-api-types.js";

export default class SessionID extends Field<null | string, string> {
	typeName = "session-id";

	open_api_type = OpenApiTypes.NONE;

	async isProperValue() {
		return Field.valid();
	}

	async encode(_: any, input: string | null): Promise<string | null> {
		if (input === null) {
			return null;
		}
		return input ? input : uuid();
	}

	async getDefaultValue(_: any) {
		return uuid();
	}

	async decode(
		_: Context,
		storage_value: string | null
	): Promise<string | null> {
		return storage_value;
	}
}
