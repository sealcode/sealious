import assert from "assert";
import { withRunningApp } from "../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../test_utils/assert-throws-async";
import { App, Context } from "../../main";
import Users from "./users";

describe("users", () => {
	describe("auto create admin", () => {
		it("should automatically create a registration intent for the admin user", async () =>
			withRunningApp(null, async ({ app }) => {
				const sealious_response = await app.collections[
					"registration-intents"
				]
					.suList()
					.filter({ email: app.manifest.admin_email })
					.fetch();

				assert.strictEqual(sealious_response.items.length, 1);
				assert.strictEqual(
					sealious_response.items[0].get("role"),
					"admin"
				);
			}));

		it("should properly handle route to account cration", async () =>
			withRunningApp(null, async ({ app, rest_api }) => {
				const sealious_response = await app.collections[
					"registration-intents"
				]
					.suList()
					.filter({ email: app.manifest.admin_email })
					.fetch();

				const {
					email,
					token,
				} = sealious_response.items[0].serializeBody();
				const response = await rest_api.get(
					`/account-creation-details?token=${token as string}&email=${
						email as string
					}`
				);
				assert(response.includes("Uzupełnij dane o Twoim koncie"));
			}));
	});

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
					"/api/v1/collections/users/me?attachments[roles]=true",
					session
				);

				const roles = Object.values(response.attachments);

				assert.strictEqual((roles as string[]).length, 1);
				assert.strictEqual(
					(roles as { user: string; role: string }[])[0].role,
					"admin"
				);
			}));
	});

	async function add_user(app: App) {
		const user = await app.collections.users.suCreate({
			username: "seal",
			password: "password",
			email: "seal@sealious.com",
			roles: [],
		});

		return app.collections["user-roles"].suCreate({
			user: user.id,
			role: "admin",
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
