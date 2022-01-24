import assert from "assert";
import { withRunningApp } from "../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../test_utils/assert-throws-async";
import { App, Context } from "../../main";
import Users from "./users";

describe("users", () => {
	describe("users routes", () => {
		it("should correctly handle me when not logged in", async () =>
			withRunningApp(null, async ({ rest_api }) => {
				await assertThrowsAsync(
					async () =>
						await rest_api.get(
							"/api/v1/collections/users/me?attachments[roles]=true"
						),
					(e) => {
						assert.strictEqual(e.response.status, 401);
						assert.strictEqual(
							e.response.data.message,
							"You're not logged in!"
						);
					}
				);
			}));

		it("should correctly handle me when logged in", async () =>
			withRunningApp(null, async ({ app, rest_api }) => {
				await add_user(app);
				const session = await rest_api.login({
					username: "seal",
					password: "password",
				});
				const response = await rest_api.get(
					"/api/v1/collections/users/me",
					session
				);
				assert.strictEqual(response.items[0].username, "seal");
			}));
	});

	async function add_user(app: App) {
		return await app.collections.users.suCreate({
			username: "seal",
			password: "password",
		});
	}

	describe("login", () => {
		it("correctly rejects when provided incorrect password", async () =>
			withRunningApp(null, async ({ app, rest_api }) => {
				await add_user(app);
				const incorrect_password_variants = [
					{ password: "", message: "Missing password!" },
					{
						password: "incorrect_password",
						message: "Incorrect password!",
					},
				];
				for (let variant of incorrect_password_variants) {
					await assertThrowsAsync(
						async () =>
							await rest_api.login({
								username: "seal",
								password: variant.password,
							}),
						(e) => {
							assert.strictEqual(e.response.status, 401);
							assert.strictEqual(
								e.response.data.message,
								variant.message
							);
						}
					);
				}
			}));

		it("correctly rejects when provided incorrect username", async () =>
			withRunningApp(null, async ({ app, rest_api }) => {
				await add_user(app);
				const incorrect_username_variants = [
					{ username: "", message: "Missing username!" },
					{
						username: "incorrect_username",
						message: "Incorrect username!",
					},
				];
				for (let variant of incorrect_username_variants) {
					await assertThrowsAsync(
						async () =>
							await rest_api.login({
								username: variant.username,
								password: "password",
							}),
						(e) => {
							assert.strictEqual(e.response.status, 401);
							assert.strictEqual(
								e.response.data.message,
								variant.message
							);
						}
					);
				}
			}));
	});

	describe(".passwordMatches()", () => {
		it("returns false if the password is incorrect", async () =>
			withRunningApp(null, async ({ app }) => {
				await app.collections.users.create(new app.SuperContext(), {
					username: "user",
					password: "password123",
				});
				assert.strictEqual(
					await Users.passwordMatches(
						new Context(app),
						"user",
						"wrong-password"
					),
					false
				);
			}));
		it("returns true if the password is correct", async () =>
			withRunningApp(null, async ({ app }) => {
				await app.collections.users.create(new app.SuperContext(), {
					username: "user",
					password: "password123",
				});
				assert.strictEqual(
					await Users.passwordMatches(
						new Context(app),
						"user",
						"password123"
					),
					true
				);
			}));
	});
});
