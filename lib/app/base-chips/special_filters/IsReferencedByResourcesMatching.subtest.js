const assert = require("assert");
const locreq = require("locreq")(__dirname);
const axios = require("axios");
const Promise = require("bluebird");

const { create_resource_as } = locreq("test_utils");
const IsReferencedByResourcesMatching = require("./IsReferencedByResourcesMatching");
const with_test_app = locreq("test_utils/with-test-app.js");

describe("IsReferencedByResourcesMatching", () => {
	async function setup(app) {
		const port = app.ConfigManager.get("www-server.port");
		const Users = app.ChipManager.get_chip("collection", "users");
		Users.set_access_strategy({
			create: "public",
			retrieve: "public",
		});

		const UsersRoles = app.createChip(app.Sealious.Collection, {
			name: "users-roles",
			fields: [
				{
					name: "user",
					type: "single_reference",
					params: { collection: "users" },
					required: true,
				},
				{
					name: "role",
					type: "enum",
					params: {
						values: ["admin", "moderator", "user"],
					},
					required: true,
				},
			],
		});

		Users.add_special_filters({
			staff: IsReferencedByResourcesMatching({
				collection: UsersRoles,
				referencing_field: "user",
				field_to_check: "role",
				allowed_values: ["admin", "moderator"],
				nopass_reason:
					"Resource you want to retrieve does not match given filter.!",
			}),
		});

		const users = [
			{
				username: "admin",
				password: "admin_password",
				email: "any@example.com",
			},
			{
				username: "moderator",
				password: "moderator_password",
				email: "any2@example.com",
			},
			{
				username: "user",
				password: "user_password",
				email: "any3@example.com",
			},
		];

		const created_users = await Promise.map(users, user =>
			create_resource_as({
				collection: "users",
				resource: user,
				port,
			})
		);

		await Promise.map(created_users, user =>
			create_resource_as({
				collection: "users-roles",
				resource: {
					user: user.id,
					role: user.body.username,
				},
				port,
			})
		);
	}

	it("returns only users with role matching `allowed_values`", () =>
		with_test_app(async ({ app, base_url }) => {
			await setup(app);
			return axios
				.get(`${base_url}/api/v1/collections/users/@staff`)
				.then(resp => {
					assert(resp.data.length > 0);
					resp.data.forEach(user =>
						assert(
							user.body.username === "admin" ||
								user.body.username === "moderator"
						)
					);
				});
		}));
});
