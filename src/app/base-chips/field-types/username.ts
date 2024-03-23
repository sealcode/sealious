import type Context from "../../../context.js";
import { Field } from "../../../main.js";

import me_synonyms from "../../../misc/me-synonyms.js";
import TextStorage from "./text-storage.js";

export default class Username extends TextStorage {
	typeName = "username";

	async isProperValue(
		context: Context,
		new_value: string,
		old_value: string
	) {
		if (old_value === new_value) {
			return Field.valid();
		}
		if (me_synonyms.indexOf(new_value) !== -1) {
			return Field.invalid(
				context.app.i18n("invalid_username", [new_value])
			);
		}

		const response = await this.app.collections.users
			.suList()
			.filter({ username: new_value })
			.fetch();

		if (!response.empty) {
			return Field.invalid(context.app.i18n("username_taken"));
		}
		return Field.valid();
	}
}
