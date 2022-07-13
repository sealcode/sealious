import * as assert from "assert";

import {
	TestAppConstructor,
	withRunningApp,
} from "../../../test_utils/with-test-app";
import { Collection, FieldTypes, Policies } from "../../../main";
import IsReferencedByResourcesMatching from "./IsReferencedByResourcesMatching";
import Users from "../../collections/users";
import type MockRestApi from "../../../test_utils/rest-api";
import { TestApp } from "../../../test_utils/test-app";

function extend(t: TestAppConstructor) {
	return class extends t {
		collections = {
			...TestApp.BaseCollections,
			users: new (class extends Users {
				policies = {
					create: new Policies.Public(),
					show: new Policies.Public(),
				};
				defaultPolicy = new Policies.Public();
				named_filters = {
					staff: new IsReferencedByResourcesMatching("users-roles", {
						referencing_collection: "users-roles",
						referencing_field: "user",
						field_to_check: "role",
						allowed_values: ["admin", "moderator"],
						nopass_reason:
							"Resource you want to retrieve does not match given filter.!",
					}),
				};
			})(),
			"users-roles": new (class extends Collection {
				fields = {
					user: new FieldTypes.SingleReference("users"),
					role: new FieldTypes.Enum(["admin", "moderator", "user"]),
				};
			})(),
		};
	};
}

describe("IsReferencedByResourcesMatching", () => {
	async function setup(rest_api: MockRestApi) {
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
		withRunningApp(extend, async ({ rest_api }) => {
			await setup(rest_api);

			return rest_api
				.get("/api/v1/collections/users/@staff")
				.then(({ items }: any) => {
					assert.ok(items.length > 0);
					items.forEach((user: any) => {
						assert.ok(
							user.username === "admin" ||
								user.username === "moderator"
						);
					});
				});
		}));
});
