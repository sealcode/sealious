import axios from "axios";
import assert from "assert";
import { withRunningApp } from "../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../test_utils/assert-throws-async";
import { App } from "../../main";

describe("user-roles", () => {
	function create_a_user(app: App, username: string) {
		return app.runAction(
			new app.SuperContext(),
			["collections", "users"],
			"create",
			{
				username,
				email: `${username}@example.com`,
				password: "password",
			}
		);
	}

	it("rejects when given an empty role", async () =>
		withRunningApp(async ({ app, base_url }) => {
			const user = await create_a_user(app, "super_user");
			await assertThrowsAsync(
				() =>
					axios.post(`${base_url}/api/v1/collections/user-roles`, {
						user: user.id,
					}),
				(e: any) => {
					assert.equal(
						e.response.data.data.role.message,
						"Missing value for field 'role'"
					);
				}
			);
		}));
	it("accepts correct dataset", async () =>
		withRunningApp(async ({ app, base_url, rest_api }) => {
			const user = await create_a_user(app, "special_user");
			const session = await rest_api.login({
				username: "special_user",
				password: "password",
			});
			const response = await axios.post(
				`${base_url}/api/v1/collections/user-roles`,
				{
					user: user.id,
					role: "admin",
				},
				session
			);
			assert.equal(response.status, 201);
		}));
});
