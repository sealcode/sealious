import { Field } from "../../../main";
import TextStorage from "./text-storage";

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
	/** The type name
	 * @ignore */
	getTypeName = () => "text";
	/** @ignore */
	params: TextParams;

	/** Depends on the provided params
	 * @internal */
	hasIndex() {
		if (this.params.full_text_search) {
			return { original: "text" as "text" };
		} else {
			return false;
		}
	}

	/** Checks if the input conforms with the constraints specified in the params
	 * @internal  */
	async isProperValue(_: any, input: string) {
		if (typeof input !== "string") {
			return Field.invalid(
				`Type of ${input} is ${typeof input}, not string.`
			);
		}
		if (this.params.min_length && input.length < this.params.min_length) {
			return Field.invalid(
				`Text '${input}' is too short, minimum length is ${this.params.min_length} chars.`
			);
		}
		if (this.params.max_length && input.length > this.params.max_length) {
			return Field.invalid(
				`Text '${input}' has exceeded max length of ${this.params.max_length} chars.`
			);
		}
		return Field.valid();
	}

	/** Sets the params @ignore */
	setParams(params: TextParams) {
		this.params = params;
	}
}
