import { withRunningApp } from "../test_utils/with-test-app.js";
import { assertThrowsAsync } from "../test_utils/assert-throws-async.js";
import assert from "assert";

describe("datastore", () => {
	afterEach(() => {
		delete process.env.SEALIOUS_DB_PORT;
	});

	it("timeouts with incorrect config", async () => {
		const fakePort = 20725;
		process.env.SEALIOUS_DB_PORT = "20725";
		await assertThrowsAsync(
			async () => {
				await withRunningApp(
					(app) => app,
					async () => null
				);
			},
			(e: Error) => {
				const url = `mongodb://127.0.0.1:${fakePort}/sealious-test`;
				assert.strictEqual(
					e.message,
					`MongoDB was not found at the following address: ${url}. Please make sure database is running.`
				);
			}
		);
	});

	it("works with correct config", async () => {
		let error: unknown = null;
		try {
			await withRunningApp(
				(app) => app,
				async () => null
			);
		} catch (e: unknown) {
			error = e;
		} finally {
			assert.strictEqual(error, null, "It didn't throw");
		}
	});
});
