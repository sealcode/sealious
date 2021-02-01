import assert from "assert";
import Int from "../app/base-chips/field-types/int";
import { App, Policies } from "../main";
import { withRunningApp } from "../test_utils/with-test-app";
import { TestAppType } from "../test_utils/test-app";
import Collection from "./collection";

type Policies = Collection["policies"];

function extend(t: TestAppType, passedPolicies: Policies = {}) {
	return class extends t {
		collections = {
			...App.BaseCollections,
			coins: new (class extends Collection {
				fields = { value: new Int() };
				policies = passedPolicies;
			})(),
		};
	};
}

describe("collection router", () => {
	it("propertly responds to a GET request to list resources", async () =>
		withRunningApp(extend, async ({ rest_api }) => {
			await rest_api.post("/api/v1/collections/coins", { value: 2 });
			const response = await rest_api.get("/api/v1/collections/coins");
			assert.ok(response.items[0].id);
			assert.strictEqual(response.items[0].value, 2);
		}));
});

describe("policy sharing for list and show", () => {
	it("proper inheritance of list policy from show policy", () => {
		return withRunningApp(
			(t) => {
				return extend(t, { show: new Policies.Noone() });
			},
			async ({ app }) => {
				assert.strictEqual(
					app.collections.coins.getPolicy("list") instanceof
						Policies.Noone,
					true
				);
			}
		);
	});
	it("proper inheritance of show policy from list policy", () => {
		return withRunningApp(
			(t) => {
				return extend(t, { list: new Policies.Noone() });
			},
			async ({ app }) => {
				assert.strictEqual(
					app.collections.coins.getPolicy("show") instanceof
						Policies.Noone,
					true
				);
			}
		);
	});

	it("action policy is favoured over inherited policy", () => {
		return withRunningApp(
			(t) => {
				return extend(t, {
					list: new Policies.Noone(),
					show: new Policies.LoggedIn(),
				});
			},
			async ({ app }) => {
				assert.strictEqual(
					app.collections.coins.getPolicy("list") instanceof
						Policies.Noone,
					true
				);
			}
		);
	});
});
