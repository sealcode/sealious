import { Parser, HtmlRenderer } from "commonmark";

import { Field, type Context, type ValidationResult } from "../../../main.js";

const parser = new Parser();
const renderer = new HtmlRenderer();

export default class Markdown extends Field<string | null> {
	typeName = "markdown";

	constructor() {
		super();
	}

	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	async decode(
		_: Context,
		db_value: string | null,
		__: unknown,
		format?: "markdown" | "html"
	) {
		if (db_value === null) {
			return null;
		}
		if (format === "html") {
			const parsed = parser.parse(db_value);
			return renderer.render(parsed);
		}
		if (format === "markdown") {
			return db_value;
		}

		return db_value;
	}

	protected isProperValue(): Promise<ValidationResult> {
		return Promise.resolve(Field.valid());
	}
}
