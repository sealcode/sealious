import assert from "assert";
import {
	type TestAppConstructor,
	withRunningApp,
} from "../../test_utils/with-test-app.js";
import { Collection, FieldTypes, Policies } from "../../main.js";
import { TestApp } from "../../test_utils/test-app.js";
import { post } from "../../test_utils/http_request.js";

const extend = (bricks_allowed: boolean) =>
	function (t: TestAppConstructor) {
		return class extends t {
			collections = {
				...TestApp.BaseCollections,
				bricks: new (class extends Collection {
					fields = {
						number: new FieldTypes.Int(),
					};
					policies = {
						create: bricks_allowed
							? new Policies.Public()
							: new Policies.Noone(),
					};
				})(),
				houses: new (class extends Collection {
					fields = {
						number: new FieldTypes.Int(),
					};
					policies = {
						create: new Policies.UsersWhoCan(["create", "bricks"]),
					};
				})(),
			};
		};
	};

describe("users-who-can", () => {
	it("should deny if the user can't perform the action", async () =>
		withRunningApp(extend(false), async ({ app, base_url }) => {
			const response = await fetch(
				`${base_url}/api/v1/collections/houses`,
				{
					method: "post",
					body: JSON.stringify({
						address: "any",
					}),
				}
			);
			const data = (await response.json()) as any;
			assert.equal(response.status, 401);
			assert.equal(
				data.message,
				new app.Context()
					.i18n`You can't ${"create"} ${"bricks"} - because '${new app.Context().i18n`Noone is allowed.`}'.`
			);
		}));

	it("should allow if the user can't perform the action", async () =>
		withRunningApp(extend(true), async ({ base_url }) => {
			await post(`${base_url}/api/v1/collections/houses`, {
				address: "any",
			});
		}));
});
