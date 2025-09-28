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

	async getOpenApiSchema(context: Context): Promise<Record<string, unknown>> {
		return {
			...(await super.getOpenApiSchema(context)),
			maxLength: this.params.max_length,
			minLength: this.params.min_length,
		};
	}

	/** Depends on the provided params
	 * @internal */
	async hasIndex() {
		if (this.params.full_text_search) {
			return { original: "text" as const };
		} else {
			return false;
		}
	}

	/** Checks if the input conforms with the constraints specified in the params
	 * @internal  */
	async isProperValue(context: Context, input: string) {
		context.app.Logger.debug2("TEXT STORAGE", "isProperValue", input);
		if (input == null) {
			return Field.valid();
		}
		if (typeof input !== "string") {
			return Field.invalid(
				context.i18n`Type of ${input} is ${typeof input}, not string.`
			);
		}
		if (this.params.min_length && input.length < this.params.min_length) {
			return Field.invalid(
				context.i18n`Text '${input}' is too short, minimum length is ${String(this.params.min_length)} chars.`
			);
		}
		if (this.params.max_length && input.length > this.params.max_length) {
			return Field.invalid(
				context.i18n`Text '${input}' has exceeded max length of ${String(this.params.max_length)} chars.`
			);
		}
		return Field.valid();
	}

	getPostgreSqlFieldDefinitions(): string[] {
		return [`"${this.name}:original" TEXT`, `"${this.name}:safe" TEXT`];
	}

	/** Sets the params @ignore */
	constructor(params: TextParams = {}) {
		super();
		this.params = params;
	}
}
