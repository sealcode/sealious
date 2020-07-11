import assert from "assert";
import { withRunningApp } from "../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../test_utils/assert-throws-async";
import axios from "axios";
import {
	Collection,
	FieldTypes,
	AccessStrategies,
	FieldDefinitionHelper as field,
} from "../../main";

describe("users-who-can", () => {
	it("should deny if the user can't perform the action", async () =>
		withRunningApp(async ({ app, base_url }) => {
			Collection.fromDefinition(app, {
				name: "bricks",
				fields: [field("number", FieldTypes.Int)],
				access_strategy: { create: AccessStrategies.Noone },
			});
			Collection.fromDefinition(app, {
				name: "houses",
				fields: [field("address", FieldTypes.Text)],
				access_strategy: {
					create: new AccessStrategies.UsersWhoCan([
						"create",
						"bricks",
					]),
				},
			});
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
		withRunningApp(async ({ app, base_url }) => {
			Collection.fromDefinition(app, {
				name: "bricks",
				fields: [field("number", FieldTypes.Int)],
				access_strategy: { create: AccessStrategies.Public },
			});
			Collection.fromDefinition(app, {
				name: "houses",
				fields: [field("address", FieldTypes.Text)],
				access_strategy: {
					create: new AccessStrategies.UsersWhoCan([
						"create",
						"bricks",
					]),
				},
			});
			await axios.post(`${base_url}/api/v1/collections/houses`, {
				address: "any",
			});
		}));
});
