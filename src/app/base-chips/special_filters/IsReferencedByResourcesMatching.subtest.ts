import * as assert from "assert";

import { withRunningApp, MockRestApi } from "../../../test_utils/with-test-app";
import {
	App,
	Collection,
	FieldTypes,
	Policies,
	FieldDefinitionHelper as field,
} from "../../../main";
import IsReferencedByResourcesMatching from "./IsReferencedByResourcesMatching";
import { CollectionResponse } from "../../../../common_lib/response/responses";

describe("IsReferencedByResourcesMatching", () => {
	async function setup(app: App, rest_api: MockRestApi) {
		const Users = app.collections.users;

		Users.setPolicy({
			create: Policies.Public,
			show: Policies.Public,
		});

		const UsersRoles = Collection.fromDefinition(app, {
			name: "users-roles", // NOT the default user-roles collection
			fields: [
				field(
					"user",
					FieldTypes.SingleReference,
					{ target_collection: () => app.collections.users },
					true
				),
				field(
					"role",
					FieldTypes.Enum,
					{
						values: ["admin", "moderator", "user"],
					},
					true
				),
			],
		});

		Users.addSpecialFilters({
			staff: new IsReferencedByResourcesMatching(
				app,
				() => app.collections["users-roles"],
				{
					referencing_field: UsersRoles.fields.user,
					field_to_check: UsersRoles.fields.role,
					allowed_values: ["admin", "moderator"],
					nopass_reason:
						"Resource you want to retrieve does not match given filter.!",
				}
			),
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
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app, rest_api);

			return rest_api
				.get("/api/v1/collections/users/@staff")
				.then(({ items }: CollectionResponse) => {
					assert.ok(items.length > 0);
					items.forEach((user) => {
						assert.ok(
							user.username === "admin" ||
								user.username === "moderator"
						);
					});
				});
		}));
});
