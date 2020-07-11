import assert from "assert";
import { withRunningApp } from "../../../test_utils/with-test-app";
import SecureHasher from "../../../utils/secure-hasher";
import App from "../../app";

describe("password", () => {
	const password = "it-really-doesnt-matter";
	const username = "some-user";
	let user_id: string;

	async function setup(app: App) {
		user_id = (
			await app.runAction(
				new app.SuperContext(),
				["collections", "users"],
				"create",
				{
					username,
					password,
					email: "some-user@example.com",
				}
			)
		).id;
	}

	it("Hides password", async () =>
		withRunningApp(async ({ app, rest_api }) => {
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
				(
					await app.runAction(
						new app.SuperContext(),
						["collections", "users", user_id],
						"show"
					)
				).password,
				"secret"
			);
		}));

	it("Stores correct password value", async () =>
		withRunningApp(async ({ app }) => {
			await setup(app);

			const hashed_password = (
				await app.Datastore.find("users", {
					sealious_id: user_id,
				})
			)[0].password;

			assert.ok(await SecureHasher.matches(password, hashed_password));
			assert.ok(
				!(await SecureHasher.matches("wrong-password", hashed_password))
			);
			assert.ok(!(await SecureHasher.matches("", hashed_password)));
		}));
});
