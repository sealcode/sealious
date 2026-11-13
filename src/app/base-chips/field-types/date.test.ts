import assert from "assert";
import {
	type TestAppConstructor,
	withRunningApp,
} from "../../../test_utils/with-test-app.js";
import { Collection, FieldTypes } from "../../../main.js";
import { TestApp } from "../../../test_utils/test-app.js";

describe("date", () => {
	it('should support a "less than" query', async () =>
		withRunningApp(
			(t: TestAppConstructor) => {
				return class extends t {
					collections = {
						...TestApp.BaseCollections,
						events: new (class extends Collection {
							name = "events";
							fields = { date: new FieldTypes.Date() };
						})(),
					};
				};
			},
			async ({ app }) => {
				await app.collections.events.suCreate({ date: "2026-10-10" });
				await app.collections.events.suCreate({ date: "2026-12-12" });
				const { items } = await app.collections.events
					.suList()
					.filter({ date: { "<": "2026-11-11" } })
					.fetch();
				assert.strictEqual(items.length, 1);
			}
		));
});
