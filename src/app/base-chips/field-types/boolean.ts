import { Field, Context } from "../../../main";

type InputType = boolean | "false" | "true" | "1" | "0" | 1 | 0;

/** A field that can be either true or false. Built to handle a variety of inputs.
 *
 * **Params**: none
 *
 * **Accepted values**: accepts actual booleans, strings (`"true"`, `"false"`) and the numbers `1` and `0`
 */
export default class Boolean extends Field<{}, InputType> {
	getTypeName = () => "boolean";
	async isProperValue(_: Context, value: InputType) {
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
		return Field.invalid(`Value '${value}' is not boolean format.`);
	}

	async encode(_: Context, value: InputType) {
		if (typeof value === "boolean") {
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

	async filterToQuery(context: Context, filter: "" | null | InputType) {
		if (filter === "") {
			return { $exists: false };
		} else if (filter === null) {
			return { $in: [true, false] };
		} else {
			return this.encode(context, filter);
		}
	}
}
