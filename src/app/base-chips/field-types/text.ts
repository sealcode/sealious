import { Field, Context } from "../../../main.js";
import TextStorage from "./text-storage.js";

export type TextParams = Partial<{
	full_text_search: boolean;
	min_length: number;
	max_length: number;
}>;

/** A simple text field. Can support full text search and have a configurable min/max length.
 *
 * **All html-like chars are escaped, so none of them are interpreted as HTML**.
 *
 * Params:
 * - `full_text_search` - `Boolean` - whether or not the DB should create a full text search for this field
 * - `min_length` - `Number` - the text should have at least this many characters
 * - `max_length` - `Number` - the text shuld have at most this many characters
 */
export default class Text extends TextStorage {
	typeName = "text";
	params: TextParams;

	/** Depends on the provided params
	 * @internal */
	async hasIndex() {
		if (this.params.full_text_search) {
			return { original: "text" as "text" };
		} else {
			return false;
		}
	}

	/** Checks if the input conforms with the constraints specified in the params
	 * @internal  */
	async isProperValue(context: Context, input: string) {
		context.app.Logger.debug2("TEXT STORAGE", "isProperValue", input);
		if (typeof input !== "string") {
			return Field.invalid(
				context.app.i18n("invalid_text", [input, typeof input])
			);
		}
		if (this.params.min_length && input.length < this.params.min_length) {
			return Field.invalid(
				context.app.i18n("too_short_text", [
					input,
					this.params.min_length,
				])
			);
		}
		if (this.params.max_length && input.length > this.params.max_length) {
			return Field.invalid(
				context.app.i18n("too_long_text", [
					input,
					this.params.max_length,
				])
			);
		}
		return Field.valid();
	}

	/** Sets the params @ignore */
	constructor(params: TextParams = {}) {
		super();
		this.params = params;
	}
}
