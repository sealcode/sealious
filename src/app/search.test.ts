import assert from "assert";
import Collection from "../chip-types/collection.js";
import { FieldTypes } from "../main.js";
import { TestApp } from "../test_utils/test-app.js";
import { withRunningApp } from "../test_utils/with-test-app.js";

describe("search", () => {
	it("Performs full-text-search", async () => {
		return withRunningApp(
			(test_app) => {
				return class extends test_app {
					collections = {
						...TestApp.BaseCollections,
						dogs: new (class extends Collection {
							fields = {
								name: new FieldTypes.Text({
									full_text_search: true,
								}),
							};
						})(),
					};
				};
			},
			async ({ app, rest_api }) => {
				await app.collections.dogs.create(new app.Context(), {
					name: "Nora",
				});
				await app.collections.dogs.create(new app.Context(), {
					name: "Greta",
				});
				const { items } = (await rest_api.get(
					"/api/v1/collections/dogs?search=Greta"
				)) as any;

				assert.deepEqual(items.length, 1);

				const { items: items2 } = await app.collections["dogs"]
					.list(new app.Context())
					.search("Nora")
					.fetch();

				assert.deepEqual(items2.length, 1);

				const { items: items3 } = await app.collections["dogs"]
					.list(new app.Context())
					.search()
					.fetch();

				assert.deepEqual(items3.length, 2);
			}
		);
	});
});
