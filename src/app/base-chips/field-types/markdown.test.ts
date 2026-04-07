import assert from "assert";
import { Collection } from "../../../main.js";
import { TestApp } from "../../../test_utils/test-app.js";
import {
	type TestAppConstructor,
	withRunningApp,
} from "../../../test_utils/with-test-app.js";
import Markdown from "./markdown.js";
import { MarkdownValue } from "./markdown-value.js";
import { getFieldValueString } from "../../../test_utils/get-field-value-string.js";

const extend = (t: TestAppConstructor) =>
	class extends t {
		collections = {
			...TestApp.BaseCollections,
			post: new (class extends Collection {
				fields = {
					content: new Markdown(),
				};
			})(),
		};
	};

describe("markdown", () => {
	it("returns MarkdownValue that preserves the source text", () =>
		withRunningApp(extend, async ({ app }) => {
			const context = new app.SuperContext();
			const response = await app.collections.post.create(context, {
				content: "# This is markdown file",
			});
			const {
				items: [item],
			} = await app.collections.post
				.list(context)
				.ids([response.id])
				.fetch();

			const value = item!.get("content");
			assert.ok(value instanceof MarkdownValue);
			assert.strictEqual(value?.toMarkdown(), "# This is markdown file");
			assert.strictEqual(
				getFieldValueString(value),
				"# This is markdown file"
			);
		}));

	it("formats markdown to html via MarkdownValue", () =>
		withRunningApp(extend, async ({ app }) => {
			const context = new app.SuperContext();
			const response = await app.collections.post.create(context, {
				content: "# Heading",
			});
			const {
				items: [item],
			} = await app.collections.post
				.list(context)
				.ids([response.id])
				.fetch();

			const value = item!.get("content") as MarkdownValue;
			assert.ok(value instanceof MarkdownValue);
			assert.strictEqual(value.toHtml(), "<h1>Heading</h1>\n");
		}));
});
