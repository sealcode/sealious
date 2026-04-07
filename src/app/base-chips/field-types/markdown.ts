import { Field, type Context, type ValidationResult } from "../../../main.js";
import { OpenApiTypes } from "../../../schemas/open-api-types.js";
import { MarkdownValue } from "./markdown-value.js";

export default class Markdown extends Field<MarkdownValue, string, string> {
	typeName = "markdown";

	open_api_type: OpenApiTypes = OpenApiTypes.STR;

	constructor() {
		super();
	}

	async decode(
		_: Context,
		db_value: string | null
	): Promise<MarkdownValue | null> {
		if (db_value === null) {
			return null;
		}
		return new MarkdownValue(db_value);
	}

	protected isProperValue(): Promise<ValidationResult> {
		return Promise.resolve(Field.valid());
	}
}
