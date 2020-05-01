const assert = require("assert");
const { with_stopped_app } = require("../../../../test_utils/with-test-app.js");
const assert_throws_async = require("../../../../test_utils/assert_throws_async.js");

describe("roles", () => {
	it("allows access to users with designated role and denies access to users without it", async () =>
		with_stopped_app(async ({ app, base_url, rest_api }) => {
			app.createChip(app.Sealious.Collection, {
				name: "secrets",
				fields: [{ name: "content", type: "text" }],
				access_strategy: { default: ["roles", ["admin"]] },
			});

			await app.start();

			await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "users"],
				"create",
				{
					username: "regular-user",
					email: "regular@example.com",
					password: "password",
				}
			);

			const admin = await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "users"],
				"create",
				{
					username: "admin",
					email: "admin@example.com",
					password: "admin-password",
				}
			);

			await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "user-roles"],
				"create",
				{ user: admin.id, role: "admin" }
			);

			await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "secrets"],
				"create",
				{ content: "It's a secret to everybody" }
			);

			const admin_session = await rest_api.login({
				username: "admin",
				password: "admin-password",
			});

			const { items: admin_response } = await rest_api.get(
				"/api/v1/collections/secrets",
				admin_session
			);
			assert.equal(admin_response.length, 1);

			const user_session = await rest_api.login({
				username: "regular-user",
				password: "password",
			});

			await assert_throws_async(
				() => rest_api.get("/api/v1/collections/secrets", user_session),
				(error) => {
					assert.equal(
						error.response.data.message,
						"Action allowed only for users with role admin."
					);
				}
			);
		}));
});
