import escape from "escape-html";
import type { FieldValue } from "./field-value.js";

export class TextValue extends String implements FieldValue {
	constructor(private original: string) {
		super(original);
		// Set the primitive value for proper string behavior
		Object.setPrototypeOf(this, TextValue.prototype);
	}

	getOriginal(): string {
		return this.original;
	}

	getHTMLSafe(): string {
		return escape(this.original);
	}

	getRestAPIValue(): string {
		return this.getHTMLSafe();
	}

	toString(): string {
		return this.getHTMLSafe();
	}
}
