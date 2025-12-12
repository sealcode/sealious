import assert from "assert";
import { default as Koa } from "koa";
import { withRunningApp } from "../../test_utils/with-test-app.js";
import { assertThrowsAsync } from "../../test_utils/assert-throws-async.js";
import { App } from "../app.js";
import Collection from "../../chip-types/collection.js";
import { FieldTypes } from "../../main.js";
import prettier from "prettier";

describe("app", () => {
	describe("metadata", () => {
		it("is cleared when running .removeAllData()", async () => {
			return withRunningApp(
				(app) => app,
				async ({ app }) => {
					await app.Metadata.set("some", "value");
					assert.strictEqual(await app.Metadata.get("some"), "value");
					await app.removeAllData();
					assert.strictEqual(
						await app.Metadata.get("some"),
						undefined
					);
				}
			);
		});
	});
	describe(".start()", () => {
		it("should throw an error if called twice", async () => {
			return withRunningApp(
				(app) => app,
				async ({ app }) => {
					await assertThrowsAsync(
						() => app.start(),
						(error) => {
							assert.strictEqual(
								error.message,
								"app should be on 'stopped' status (current status - 'running')"
							);
						}
					);
				}
			);
		});
	});

	describe("rss feed variants", () => {
		it("generates valid links for all variants", async () => {
			return withRunningApp(
				(t) =>
					class extends t {
						collections = {
							...App.BaseCollections,
							posts: new (class extends Collection {
								fields = {
									title: new FieldTypes.Text(),
									content: new FieldTypes.Text(),
								};
							})(),
						};
					},

				async ({ app }) => {
					app.manifest.rss_variants = [
						["light", "dark"],
						["mobile", "desktop"],
					];

					const expected_links = [
						["light", "mobile"],
						["light", "desktop"],
						["dark", "mobile"],
						["dark", "desktop"],
					].map((variant) => {
						const param = variant.join("+");
						return /* HTML */ `<link
							href="/api/v1/collections/posts/feed?variant=${param}"
							type="application/atom+xml"
							rel="alternate"
							title="testing app / posts feed (${param})"
						/>`;
					});

					const metatags = await app.getFeedHTMLMetatags({
						$app: app,
					} as unknown as Koa.Context);

					const expected_metatags = expected_links.join("");

					assert.strictEqual(
						await prettier.format(metatags, { parser: "html" }),
						await prettier.format(expected_metatags, {
							parser: "html",
						})
					);
				}
			);
		});
	});

	describe("atom feed", () => {
		it("generates a valid XML feed for a list of blog items", async () =>
			withRunningApp(
				(t) =>
					class extends t {
						collections = {
							...App.BaseCollections,
							posts: new (class extends Collection {
								fields = {
									title: new FieldTypes.Text(),
									content: new FieldTypes.Text(),
								};
							})(),
						};
					},

				async ({ app }) => {
					const metatags = await app.getFeedHTMLMetatags({
						$app: app,
					} as unknown as Koa.Context);
					assert.strictEqual(
						await prettier.format(metatags, { parser: "html" }),
						await prettier.format(
							/* HTML */ `<link
								href="/api/v1/collections/posts/feed"
								type="application/atom+xml"
								rel="alternate"
								title="testing app / posts feed"
							/>`,
							{ parser: "html" }
						)
					);
				}
			));
	});
});
