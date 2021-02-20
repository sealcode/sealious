import assert from "assert";
import { App, Collection, FieldTypes, SuperContext } from "../main";
import { withRunningApp } from "../test_utils/with-test-app";

describe("CollectionItem", () => {
	it("first inserts, then updates on successive .save() calls", async () =>
		withRunningApp(
			(test_app) =>
				class extends test_app {
					collections = {
						...App.BaseCollections,
						entries: new (class extends Collection {
							fields = { title: new FieldTypes.Text() };
						})(),
					};
				},
			async ({ app }) => {
				const entry = await app.collections.entries.suCreate({
					title: "title",
				});
				entry.set("title", "title2");
				await entry.save(new SuperContext(app));
				const {
					items: entries,
				} = await app.collections.entries.suList().fetch();
				assert.strictEqual(entries.length, 1);
				assert.strictEqual(entries[0].get("title"), "title2");
			}
		));
});
