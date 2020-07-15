import assert from "assert";
import axios from "axios";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async";
import { withRunningApp } from "../../../test_utils/with-test-app";
import App from "../../app";
import { SingleItemResponse } from "../../../../common_lib/response/responses";
import {
	Collection,
	FieldTypes,
	FieldDefinitionHelper as field,
	Policies,
} from "../../../main";

describe("settable-by", async () => {
	function create_collections(app: App) {
		Collection.fromDefinition(app, {
			name: "forbidden-collection",
			fields: [
				field("any", FieldTypes.SettableBy, {
					base_field_type: FieldTypes.Int,
					base_field_params: {},
					policy: Policies.Noone,
				}),
			],
		});

		Collection.fromDefinition(app, {
			name: "allowed-collection",
			fields: [
				field("any", FieldTypes.SettableBy, {
					policy: Policies.Public,
					base_field_type: FieldTypes.Int,
					base_field_params: {},
				}),
			],
		});
	}

	it("should not allow any value when rejected by access strategy", async () =>
		withRunningApp(async ({ app, base_url }) => {
			create_collections(app);
			await assertThrowsAsync(
				() =>
					axios.post(
						`${base_url}/api/v1/collections/forbidden-collection`,
						{
							any: "thing",
						}
					),
				(e) =>
					assert.equal(
						e.response.data.data.any.message,
						"noone is allowed"
					)
			);
		}));

	it("should allow proper value when accepted by access strategy", async () =>
		withRunningApp(async ({ app, base_url, rest_api }) => {
			create_collections(app);

			const response = (
				await axios.post(
					`${base_url}/api/v1/collections/allowed-collection`,
					{
						any: 1,
					}
				)
			).data;
			assert.equal(response.any, 1);

			const response2 = (await rest_api.getSealiousResponse(
				`/api/v1/collections/allowed-collection/${response.id}`
			)) as SingleItemResponse;
			assert.equal(response2.any, 1);
		}));

	it("should not allow invalid value when access strategy allows", async () =>
		withRunningApp(async ({ app, base_url }) => {
			create_collections(app);
			await assertThrowsAsync(
				() =>
					axios.post(
						`${base_url}/api/v1/collections/allowed-collection`,
						{
							any: "thing",
						}
					),
				(e) => {
					assert.equal(
						e.response.data.data.any.message,
						"Value 'thing' is not a int number format."
					);
				}
			);
		}));
});
