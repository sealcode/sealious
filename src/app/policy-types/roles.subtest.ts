import assert from "assert";
import { withRunningApp } from "../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../test_utils/assert-throws-async";
import { Collection, FieldTypes, Policies } from "../../main";
import { TestAppType } from "../../test_utils/test-app";

const ALLOWED_ROLES = ["admin"];

function extend(t: TestAppType) {
	return class extends t {
		collections = {
			...t.BaseCollections,
			secrets: new (class extends Collection {
				fields = {
					content: new FieldTypes.Text(),
				};
				defaultPolicy = new Policies.Roles(ALLOWED_ROLES);
			})(),
		};
	};
}

describe("roles", () => {
	it("allows access to users with designated role and denies access to users without it", async () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			await app.collections.users.suCreate({
				username: "regular-user",
				email: "regular@example.com",
				password: "password",
				roles: [],
			});

			const admin = await app.collections.users.suCreate({
				username: "admin",
				email: "admin@example.com",
				password: "admin-password",
				roles: [],
			});

			await app.collections["user-roles"].suCreate({
				user: admin.id,
				role: "admin",
			});

			await app.collections.secrets.suCreate({
				content: "It's a secret to everybody",
			});

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
						app.i18n("policy_roles_deny", ALLOWED_ROLES.join(", "))
					);
				}
			);
		}));
});
