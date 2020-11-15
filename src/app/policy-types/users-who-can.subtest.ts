import assert from "assert";
import { withRunningApp } from "../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../test_utils/assert-throws-async";
import axios from "axios";
import { Collection, FieldTypes, Policies } from "../../main";
import { TestAppType } from "../../test_utils/test-app";

const extend = (bricks_allowed: boolean) =>
	function (t: TestAppType) {
		return class extends t {
			collections = {
				...t.BaseCollections,
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
		withRunningApp(extend(false), async ({ base_url }) => {
			await assertThrowsAsync(
				async () =>
					axios
						.post(`${base_url}/api/v1/collections/houses`, {
							address: "any",
						})
						.then(),
				(e: any) => {
					assert.equal(e.response.status, 401);
					assert.equal(
						e.response.data.message,
						"you can't create bricks - because  noone is allowed"
					);
				}
			);
		}));

	it("should allow if the user can't perform the action", async () =>
		withRunningApp(extend(true), async ({ base_url }) => {
			await axios.post(`${base_url}/api/v1/collections/houses`, {
				address: "any",
			});
		}));
});
