const locreq = require("locreq")(__dirname);
const axios = require("axios");
const assert = require("assert");
const { with_running_app } = locreq("test_utils/with-test-app.js");
const { assert_throws_async } = locreq("test_utils");

describe("user-roles", () => {
	function create_a_user(app, username) {
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
				e => {
					assert(
						e.response.data.data.role.message ===
							"Missing value for field 'role'"
					);
				}
			);
		}));
	it("accepts correct dataset", async () =>
		with_running_app(async ({ app, base_url }) => {
			const user = await create_a_user(app, "special_user");
			const response = await axios.post(
				`${base_url}/api/v1/collections/user-roles`,
				{
					user: user.id,
					role: "admin",
				}
			);
			assert(response.status === 201);
		}));
});
