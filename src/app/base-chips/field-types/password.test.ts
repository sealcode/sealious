import assert from "assert";
import { withRunningApp } from "../../../test_utils/with-test-app.js";
import SecureHasher from "../../../utils/secure-hasher.js";
import type { App } from "../../app.js";

describe("password", () => {
	const password = "it-really-doesnt-matter";
	const username = "some-user";
	let user_id: string;

	async function setup(app: App) {
		user_id = (
			await app.collections.users.suCreate({
				username,
				password,
			})
		).id;
	}

	it("Hides password", async () =>
		withRunningApp(null, async ({ app, rest_api }) => {
			await setup(app);
			const session = await rest_api.login({
				username,
				password,
			});

			assert.ok(
				!(
					await rest_api.get(
						`/api/v1/collections/users/${user_id}`,
						session
					)
				).password
			);

			assert.equal(
				(await app.collections.users.suGetByID(user_id)).get(
					"password"
				),
				"secret"
			);
		}));

	it("Stores correct password value", async () =>
		withRunningApp(null, async ({ app }) => {
			await setup(app);

			const hashed_password = (
				await app.Datastore.find("users", {
					id: user_id,
				})
			)[0].password as string;

			assert.ok(await SecureHasher.matches(password, hashed_password));
			assert.ok(
				!(await SecureHasher.matches("wrong-password", hashed_password))
			);
			assert.ok(!(await SecureHasher.matches("", hashed_password)));
		}));
});
