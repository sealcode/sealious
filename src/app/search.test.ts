import assert from "assert";
import Collection from "../chip-types/collection";
import { FieldTypes } from "../main";
import { withRunningApp } from "../test_utils/with-test-app";

describe("search", () => {
	it("Performs full-text-search", async () => {
		return withRunningApp(
			(test_app) => {
				return class extends test_app {
					collections = {
						...test_app.BaseCollections,
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
				const { items } = await rest_api.get(
					"/api/v1/collections/dogs?search=Greta"
				);

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
