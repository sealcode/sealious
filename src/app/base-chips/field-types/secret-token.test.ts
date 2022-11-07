import assert from "assert";
import {
	TestAppConstructor,
	withRunningApp,
} from "../../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async";
import { App, Collection, FieldTypes, Policies } from "../../../main";
import { sleep } from "../../../test_utils/sleep";

const URL = "/api/v1/collections/boolseals";

function extend(t: TestAppConstructor) {
	const boolseals = new (class extends Collection {
		name = "boolseals";
		fields = {
			is_old: FieldTypes.Required(new FieldTypes.Boolean()),
		};
		defaultPolicy = new Policies.Public();
	})();
	return class extends t {
		collections = {
			...App.BaseCollections,
			boolseals,
		};
	};
}

describe("boolean", () => {
	it("Allows to insert values considered correct", async () =>
		withRunningApp(
			function (t: TestAppConstructor) {
				return class extends t {
					collections = {
						...App.BaseCollections,
						secrets: new (class extends Collection {
							name = "secrets";
							fields = {
								secret: new FieldTypes.SecretToken(),
							};
							defaultPolicy = new Policies.Public();
						})(),
					};
				};
			},
			async ({ app }) => {
				// the first one is not used but crucial, as we want to get 1
				// token in the end assertion, not two
				await app.collections["secrets"].suCreate({
					secret: "yes",
				});
				await sleep(10);
				const token_item = await app.collections["secrets"].suCreate({
					secret: "yes",
				});
				await sleep(10);
				await app.collections["secrets"].suCreate({
					secret: "yes",
				});
				const secret = token_item.get("secret");
				const { items: filtered_items } = await app.collections.secrets
					.suList()
					.filter({ secret })
					.paginate({ items: 1 })
					.fetch();
				assert.strictEqual(filtered_items.length, 1);
				assert.strictEqual(filtered_items[0].get("secret"), secret);
			}
		));
});
