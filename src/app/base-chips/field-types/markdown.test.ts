import assert from "assert";
import { Collection, SuperContext } from "../../../main.js";
import { withRunningApp } from "../../../test_utils/with-test-app.js";
import { TestApp } from "../../../test_utils/test-utils.js";
import Markdown from "./markdown.js";

const testFormating = (
	input: string,
	format: "html" | "markdown",
	expected_value: string
) =>
	withRunningApp(
		(test_app_type) => {
			return class extends test_app_type {
				collections = {
					...TestApp.BaseCollections,
					post: new (class extends Collection {
						fields = {
							content: new Markdown(),
						};
					})(),
				};
			};
		},
		async ({ app }) => {
			const context = new SuperContext(app);

			const response = await app.collections.post.create(context, {
				content: input,
			});

			const {
				items: [item],
			} = await app.collections.post
				.list(context)
				.ids([response.id])
				.format({ content: format })
				.fetch();

			assert.strictEqual(item.get("content"), expected_value);
		}
	);

describe("markdown", () => {
	it("should map markdown to html", () => {
		return testFormating(
			"# This is markdown file",
			"html",
			"<h1>This is markdown file</h1>\n"
		);
	});

	it("should return source markdown text", () => {
		return testFormating(
			"# This is markdown file",
			"markdown",
			"# This is markdown file"
		);
	});
});
