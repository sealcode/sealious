import assert from "assert";
import { withRunningApp } from "../test_utils/with-test-app";
import { assertThrowsAsync } from "../test_utils/assert-throws-async";
import type { AxiosError } from "axios";

describe("Extract context", () => {
	it("Behaves correctly when the session cookie is missing", async () =>
		withRunningApp(null, async ({ app, rest_api }) => {
			const user = await app.collections.users.suCreate({
				username: "any",
				password: "anyanyany",
			});

			await rest_api.login({ username: "any", password: "anyanyany" });

			await assertThrowsAsync(
				() => rest_api.get("/api/v1/collections/users/me"), // cookie left out intentionally
				(error: AxiosError) => {
					assert.strictEqual(
						error?.response?.data?.message,
						"You're not logged in!"
					);
				}
			);
		}));
});
