import assert from "assert";
import { Collection, FieldTypes, Policies } from "../../../main";
import { TestApp } from "../../../test_utils/test-app";
import { TestAppConstructor, withRunningApp } from "../../../test_utils/with-test-app";

function extend(t: TestAppConstructor) {
	return class extends t {
		collections = {
			...TestApp.BaseCollections,
			wallet: new (class extends Collection {
				fields = {
					simoleon: new FieldTypes.Money(),
				};
				defaultPolicy = new Policies.Public();
			})(),
		};
	};
}

describe("money", () => {
	it("should return two digits after the decimal separator even for integers", async () =>
		withRunningApp(extend, async ({ app }) => {
			await app.collections.wallet.suCreate({ simoleon: 1 });
			const response = await app.collections.wallet
				.list(new app.SuperContext())
				.format({ simoleon: "string" })
				.fetch();

			assert.strictEqual(response.items[0].get("simoleon"), "1.00");
		}));

	it("should correctly format with two decimal points float value", async () =>
		withRunningApp(extend, async ({ app }) => {
			await app.collections.wallet.suCreate({ simoleon: 14.43 });
			const response = await app.collections.wallet
				.list(new app.SuperContext())
				.format({ simoleon: "string" })
				.fetch();

			assert.strictEqual(response.items[0].get("simoleon"), "14.43");
		}));

	it("should correctly format with more than two decimal points float value", async () =>
		withRunningApp(extend, async ({ app }) => {
			await app.collections.wallet.suCreate({ simoleon: 53.1423 });
			const response = await app.collections.wallet
				.list(new app.SuperContext())
				.format({ simoleon: "string" })
				.fetch();

			assert.strictEqual(response.items[0].get("simoleon"), "53.14");
		}));
});
