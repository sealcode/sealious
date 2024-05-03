import { Field, Context } from "../../../main.js";

type InputType = boolean | "false" | "true" | "1" | "0" | 1 | 0;

/** A field that can be either true or false. Built to handle a variety of inputs.
 *
 * **Params**: none
 *
 * **Accepted values**: accepts actual booleans, strings (`"true"`, `"false"`) and the numbers `1` and `0`
 */
export default class Boolean extends Field<boolean, InputType> {
	typeName = "boolean";
	async isProperValue(ctx: Context, value: InputType) {
		if (typeof value === "boolean") {
			return Field.valid();
		}
		if (
			(typeof value === "string" || typeof value === "number") &&
			(value.toString() === "1" || value.toString() === "0")
		) {
			return Field.valid();
		}
		if (
			typeof value === "string" &&
			(value.toLowerCase() === "true" || value.toLowerCase() === "false")
		) {
			return Field.valid();
		}
		return Field.invalid(ctx.app.i18n("invalid_boolean", [value]));
	}

	async encode(_: Context, value: InputType | null) {
		if (value === null) {
			return null;
		} else if (typeof value === "boolean") {
			return value;
		} else if (value.toString() === "1") {
			return true;
		} else if (value.toString() === "0") {
			return false;
		} else if (typeof value === "string") {
			if (value.toLowerCase() === "true") {
				return true;
			} else if (value.toLowerCase() === "false") {
				return false;
			}
		}
		throw new Error("invalid value");
	}

	async getMatchQueryValue(context: Context, filter: "" | null | InputType) {
		if (filter === "") {
			return { $exists: false };
		} else if (filter === null) {
			return { $in: [true, false] };
		} else {
			return this.encode(context, filter);
		}
	}
}
