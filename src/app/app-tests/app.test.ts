import assert from "assert";
import { withRunningApp } from "../../test_utils/with-test-app.js";

describe("app", () => {
	describe("metadata", () => {
		it("is cleared when running .removeAllData()", async () => {
			return withRunningApp(
				(app) => app,
				async ({ app }) => {
					await app.Metadata.set("some", "value");
					assert.strictEqual(await app.Metadata.get("some"), "value");
					await app.removeAllData();
					assert.strictEqual(
						await app.Metadata.get("some"),
						undefined
					);
				}
			);
		});
	});
});
