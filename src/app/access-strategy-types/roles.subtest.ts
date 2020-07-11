import assert from "assert";
import { withStoppedApp } from "../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../test_utils/assert-throws-async";
import { Collection, FieldTypes } from "../../main";
import Roles from "./roles";

describe("roles", () => {
	it("allows access to users with designated role and denies access to users without it", async () =>
		withStoppedApp(async ({ app, rest_api }) => {
			Collection.fromDefinition(app, {
				name: "secrets",
				fields: [{ name: "content", type: FieldTypes.Text }],
				access_strategy: { default: [Roles, ["admin"]] },
			});

			await app.start();

			await app.runAction(
				new app.SuperContext(),
				["collections", "users"],
				"create",
				{
					username: "regular-user",
					email: "regular@example.com",
					password: "password",
				}
			);

			const admin = await app.runAction(
				new app.SuperContext(),
				["collections", "users"],
				"create",
				{
					username: "admin",
					email: "admin@example.com",
					password: "admin-password",
				}
			);

			await app.runAction(
				new app.SuperContext(),
				["collections", "user-roles"],
				"create",
				{ user: admin.id, role: "admin" }
			);

			await app.runAction(
				new app.SuperContext(),
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

			await assertThrowsAsync(
				() => rest_api.get("/api/v1/collections/secrets", user_session),
				(error) => {
					assert.equal(
						(error as any).response.data.message,
						"you dont have any of the roles: admin."
					);
				}
			);
		}));
});
