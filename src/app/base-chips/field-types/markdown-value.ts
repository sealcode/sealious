import { Parser, HtmlRenderer } from "commonmark";
import type { FieldValue } from "./field-value.js";

const parser = new Parser();
const renderer = new HtmlRenderer();

export class MarkdownValue implements FieldValue {
	private htmlCache: string | null = null;

	constructor(private readonly markdown: string) {}

	toMarkdown(): string {
		return this.markdown;
	}

	toHtml(): string {
		if (this.htmlCache === null) {
			const parsed = parser.parse(this.markdown);
			this.htmlCache = renderer.render(parsed);
		}
		return this.htmlCache;
	}

	toString(): string {
		return this.toMarkdown();
	}

	getRestAPIValue(): string {
		return this.toMarkdown();
	}
}
