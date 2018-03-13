const assert = require("assert");
const locreq = require("locreq")(__dirname);
const axios = require("axios");
const Promise = require("bluebird");

const { create_resource_as } = locreq("test_utils");
const IsReferencedByResourcesMatching = require("./IsReferencedByResourcesMatching");

describe("IsReferencedByResourcesMatching", () => {
	let App = null;
	const port = 8888;
	const base_url = `http://localhost:${port}/api/v1`;
	beforeEach(async () => {
		App = new Sealious.App(
			{
				"www-server": { port: 8888 },
				upload_path: "/dev/null",
				logger: { level: "emerg" },
				datastore_mongo: TestApp.ConfigManager.get("datastore_mongo"),
			},
			TestApp.manifest
		);

		const Users = App.ChipManager.get_chip("collection", "users");
		Users.set_access_strategy({
			create: "public",
			retrieve: "public",
		});

		const UsersRoles = App.createChip(Sealious.Collection, {
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

		await App.start();

		const users = [
			{ username: "admin", password: "admin_password" },
			{ username: "moderator", password: "moderator_password" },
			{ username: "user", password: "user_password" },
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
	});

	it("returns only users with role matching `allowed_values`", () =>
		axios
			.get(`${base_url}/collections/users/@staff`)
			.then(resp =>
				resp.data.forEach(user =>
					assert(
						user.body.username === "admin" || user.body.username === "moderator"
					)
				)
			));

	afterEach(async () => {
		await Promise.all(
			App.ChipManager.get_all_collections().map(collection_name =>
				App.Datastore.remove(collection_name, {}, "just_one" && false)
			)
		);
		await App.stop();
	});
});
