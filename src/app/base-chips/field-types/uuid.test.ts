import assert from "assert";
import { withRunningApp } from "../../../test_utils/with-test-app.js";
import { App, Collection, FieldTypes, Policies } from "../../../main.js";

describe("boolean", () => {
	it("lets filter by literal false value", () =>
		withRunningApp(
			(TestApp) =>
				class extends TestApp {
					collections = {
						...App.BaseCollections,
						items: new (class extends Collection {
							name = "boolseals";
							fields = {
								uuid: new FieldTypes.Uuid(),
							};
							defaultPolicy = new Policies.Public();
						})(),
					};
				},
			async ({ app }) => {
				const item = await app.collections.items.suCreate({});
				// this second item is important, as we're counting the amount
				// of results in the end
				await app.collections.items.suCreate({});
				const { items: items } = await app.collections.items
					.suList()
					.filter({ uuid: item.get("uuid") as string })
					.fetch();
				assert.strictEqual(items.length, 1);
			}
		));
});
