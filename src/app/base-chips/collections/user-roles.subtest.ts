import axios from "axios";
import assert from "assert";
import { with_running_app } from "../../../../test_utils/with-test-app.js";
import { assert_throws_async } from "../../../../test_utils";
import { App } from "../../../main.js";

describe("user-roles", () => {
	function create_a_user(app: App, username: string) {
		return app.run_action(
			new app.Sealious.SuperContext(),
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
		with_running_app(async ({ app, base_url }) => {
			const user = await create_a_user(app, "super_user");
			await assert_throws_async(
				() =>
					axios.post(`${base_url}/api/v1/collections/user-roles`, {
						user: user.id,
					}),
				(e: any) => {
					assert(
						e.response.data.data.role.message ===
							"Missing value for field 'role'"
					);
				}
			);
		}));
	it("accepts correct dataset", async () =>
		with_running_app(async ({ app, base_url, rest_api }) => {
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
