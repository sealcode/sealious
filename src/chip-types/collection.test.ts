import assert from "assert";
import Int from "../app/base-chips/field-types/int";
import { App } from "../main";
import { withRunningApp } from "../test_utils/with-test-app";
import Collection from "./collection";

describe("collection router", () => {
	it("propertly responds to a GET request to list resources", async () =>
		withRunningApp(
			(t) =>
				class extends t {
					collections = {
						...App.BaseCollections,
						coins: new (class extends Collection {
							fields = { value: new Int() };
						})(),
					};
				},
			async ({ rest_api }) => {
				await rest_api.post("/api/v1/collections/coins", { value: 2 });
				const response = await rest_api.get(
					"/api/v1/collections/coins"
				);
				assert.ok(response.items[0].id);
				assert.strictEqual(response.items[0].value, 2);
			}
		));
});
