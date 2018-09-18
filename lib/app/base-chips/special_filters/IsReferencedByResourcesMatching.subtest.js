const assert = require("assert");
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");

const { with_running_app } = locreq("test_utils/with-test-app.js");

describe("IsReferencedByResourcesMatching", () => {
	async function setup(app, rest_api) {
		const Users = app.ChipManager.get_chip("collection", "users");
		Users.set_access_strategy({
			create: "public",
			show: "public",
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
			staff: app.SpecialFilter.IsReferencedByResourcesMatching({
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

		for (let user of users) {
			const { id, username } = await rest_api.post(
				"/api/v1/collections/users",
				user
			);
			await rest_api.post("/api/v1/collections/users-roles", {
				user: id,
				role: username,
			});
		}
	}

	it("returns only users with role matching `allowed_values`", () =>
		with_running_app(async ({ app, rest_api }) => {
			await setup(app, rest_api);

			return rest_api
				.get("/api/v1/collections/users/@staff")
				.then(({ items }) => {
					assert(items.length > 0);
					items.forEach(user =>
						assert(
							user.username === "admin" ||
								user.username === "moderator"
						)
					);
				});
		}));
});
