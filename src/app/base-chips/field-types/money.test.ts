import assert from "assert";
import { Collection, FieldTypes, Policies } from "../../../main.js";
import { TestApp } from "../../../test_utils/test-app.js";
import {
	type TestAppConstructor,
	withRunningApp,
} from "../../../test_utils/with-test-app.js";
import { MoneyValue } from "./money-value.js";

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
				.fetch();

			const value = response.items[0]!.get("simoleon");
			assert.ok(value instanceof MoneyValue);
			assert.strictEqual(value?.toNumber(), 1);
			assert.strictEqual(value?.toString(), "1.00");
		}));

	it("should correctly format with two decimal points float value", async () =>
		withRunningApp(extend, async ({ app }) => {
			await app.collections.wallet.suCreate({ simoleon: 14.43 });
			const response = await app.collections.wallet
				.list(new app.SuperContext())
				.fetch();

			const value = response.items[0]!.get("simoleon");
			assert.ok(value instanceof MoneyValue);
			assert.strictEqual(value?.toNumber(), 14.43);
			assert.strictEqual(value?.toString(), "14.43");
		}));

	it("should correctly format with more than two decimal points float value", async () =>
		withRunningApp(extend, async ({ app }) => {
			await app.collections.wallet.suCreate({ simoleon: 53.1423 });
			const response = await app.collections.wallet
				.list(new app.SuperContext())
				.fetch();

			const value = response.items[0]!.get("simoleon");
			assert.ok(value instanceof MoneyValue);
			assert.strictEqual(value?.toNumber(), 53.1423);
			assert.strictEqual(value?.toString(), "53.14");
		}));
});
