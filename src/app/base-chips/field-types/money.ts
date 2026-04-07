import type { Context } from "../../../main.js";
import Float from "./float.js";
import { MoneyValue } from "./money-value.js";

export default class Money extends Float<MoneyValue> {
	typeName = "money";

	async decode(
		context: Context,
		db_value: number | null
	): Promise<MoneyValue | null> {
		context.app.Logger.debug2("FIELD MONEY", "decode", {
			db_value,
		});
		if (db_value === null || db_value === undefined) {
			return null;
		}
		return new MoneyValue(db_value);
	}

	getPostgreSqlFieldDefinitions(): string[] {
		return [`"${this.name}" NUMERIC`];
	}
}
