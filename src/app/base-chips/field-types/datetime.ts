import { IntStorage } from "./int.js";
import { Context, Field } from "../../../main.js";

import { OpenApiTypes } from "../../../schemas/open-api-types.js";

// cannot extends because that changes the output of `decode`. I should use composition here

export const DATETIME_FIELD_TYPE_NAME = "datetime";

/** Stores a date and the time. Accepts only timestamps - number or ms since Epoch. Can be configured and filtered by in the same way as other {@link IntStorage}-based fields.
 */
export default class Datetime extends IntStorage {
	typeName = DATETIME_FIELD_TYPE_NAME;

	open_api_type: OpenApiTypes = OpenApiTypes.DATETIME;

	async isProperValue(context: Context, value: number | string) {
		const int_result = await super.isProperValue(context, value);
		if (!int_result.valid) {
			return Field.invalid(
				context.i18n`Value '${value}' is not datetime format. Only timestamps are accepted.`
			);
		}
		return int_result;
	}

	async decode(context: Context, db_value: number | null) {
		context.app.Logger.debug2("FIELD DATETIME", "decode", {
			db_value,
		});
		if (db_value === null || db_value === undefined) {
			return null;
		}
		return db_value;
	}

	getPostgreSqlFieldDefinitions(): string[] {
		return [`"${this.name}" TIMESTAMP`];
	}
}
