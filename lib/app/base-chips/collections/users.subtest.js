const assert = require("assert");
const { with_running_app } = require("../../../../test_utils/with-test-app.js");
const assert_throws_async = require("../../../../test_utils/assert_throws_async.js");

describe("users", () => {
	describe("auto create admin", () => {
		it("should automatically create a registration intent for the admin user", async () =>
			with_running_app(async ({ app }) => {
				const sealious_response = await app.run_action(
					new app.Sealious.SuperContext(),
					["collections", "registration-intents"],
					"show",
					{ filter: { email: app.manifest.admin_email } }
				);

				assert.equal(sealious_response.items.length, 1);
				assert.equal(sealious_response.items[0].role, "admin");
			}));

		it("should properly handle route to account cration", async () =>
			with_running_app(async ({ app, rest_api }) => {
				const sealious_response = await app.run_action(
					new app.Sealious.SuperContext(),
					["collections", "registration-intents"],
					"show",
					{ filter: { email: app.manifest.admin_email } }
				);

				const { email, token } = sealious_response.items[0];
				const response = await rest_api.get(
					`/account-creation-details?token=${token}&email=${email}`
				);
				assert(response.includes("Uzupełnij dane o Twoim koncie"));
			}));
	});

	describe("users routes", () => {
		it("should correctly handle me when not logged in", async () =>
			with_running_app(async ({ app, rest_api }) => {
				await assert_throws_async(
					async () =>
						await rest_api.get(
							"/api/v1/users/me?attachments[roles]=true"
						),
					(e) => {
						assert.equal(e.response.status, 401);
						assert.equal(
							e.response.data.message,
							"You're not logged in!"
						);
					}
				);
			}));

		it("should correctly handle me when logged in", async () =>
			with_running_app(async ({ app, rest_api }) => {
				await add_user(app);
				const session = await rest_api.login({
					username: "seal",
					password: "seal",
				});
				const { roles } = await rest_api.getSealiousResponse(
					"/api/v1/users/me?attachments[roles]=true",
					session
				);

				assert.equal(roles.length, 1);
				assert.equal(roles[0].role, "admin");
			}));
	});

	async function add_user(app) {
		const user = await app.run_action(
			new app.Sealious.SuperContext(),
			["collections", "users"],
			"create",
			{
				username: "seal",
				password: "seal",
				email: "seal@sealious.com",
			}
		);

		return app.run_action(
			new app.Sealious.SuperContext(),
			["collections", "user-roles"],
			"create",
			{ user: user.id, role: "admin" }
		);
	}

	describe("login", () => {
		it("correctly rejects when provided incorrect password", async () =>
			with_running_app(async ({ app, rest_api }) => {
				await add_user(app);
				const incorrect_password_variants = [
					{ password: "", message: "Missing password!" },
					{
						password: "incorrect_password",
						message: "Incorrect password!",
					},
				];
				for (let variant of incorrect_password_variants) {
					await assert_throws_async(
						async () =>
							await rest_api.login({
								username: "seal",
								password: variant.password,
							}),
						(e) => {
							assert.equal(e.response.status, 401);
							assert.equal(
								e.response.data.message,
								variant.message
							);
						}
					);
				}
			}));

		it("correctly rejects when provided incorrect username", async () =>
			with_running_app(async ({ app, rest_api }) => {
				await add_user(app);
				const incorrect_username_variants = [
					{ username: "", message: "Missing username!" },
					{
						username: "incorrect_username",
						message: "Incorrect username!",
					},
				];
				for (let variant of incorrect_username_variants) {
					await assert_throws_async(
						async () =>
							await rest_api.login({
								username: variant.username,
								password: "seal",
							}),
						(e) => {
							assert.equal(e.response.status, 401);
							assert.equal(
								e.response.data.message,
								variant.message
							);
						}
					);
				}
			}));
	});
});
