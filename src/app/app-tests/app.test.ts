import assert from "assert";
import { withRunningApp } from "../../test_utils/with-test-app.js";
import { assertThrowsAsync } from "../../test_utils/assert-throws-async.js";

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
	describe(".start()", () => {
		it("should throw an error if called twice", async () => {
			return withRunningApp(
				(app) => app,
				async ({ app }) => {
					await assertThrowsAsync(
						() => app.start(),
						(error) => {
							assert.strictEqual(
								error.message,
								"app should be on 'stopped' status (current status - 'running')"
							);
						}
					);
				}
			);
		});
	});
});
