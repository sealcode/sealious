import type { Context } from "../../../main.js";
import Float from "./float.js";

export default class Money extends Float<number | string> {
	typeName = "money";

	async decode(
		context: Context,
		db_value: number | null,
		__: number,
		format?: "string"
	): Promise<number | string | null> {
		context.app.Logger.debug2("FIELD MONEY", "decode", {
			db_value,
			format,
		});
		if (db_value === null || db_value === undefined) {
			return db_value;
		}
		if (format === undefined) {
			return db_value;
		}
		if (format === "string") {
			const value = new Number(db_value);
			return value.toFixed(2);
		}
		return db_value;
	}

	getPostgreSqlFieldDefinitions(): string[] {
		return [`"${this.name}" NUMERIC`];
	}
}
