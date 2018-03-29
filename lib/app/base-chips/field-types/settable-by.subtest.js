const assert = require("assert");
const locreq = require("locreq")(__dirname);
const axios = require("axios");
const { create_resource_as, assert_throws_async } = locreq("test_utils");
const { with_running_app } = locreq("test_utils/with-test-app.js");

describe("settable-by", async () => {
	function create_collections(app) {
		const int = app.ChipManager.get_chip("field_type", "int");

		app.createChip(app.Sealious.Collection, {
			name: "forbidden-collection",
			fields: [
				{
					name: "any",
					type: "settable-by",
					params: {
						access_strategy_description: "noone",
						target_field_type: int,
					},
				},
			],
		});

		app.createChip(app.Sealious.Collection, {
			name: "allowed-collection",
			fields: [
				{
					name: "any",
					type: "settable-by",
					params: {
						access_strategy_description: "public",
						target_field_type: int,
					},
				},
			],
		});
	}

	it("should not allow any value when rejected by access strategy", async () =>
		with_running_app(async ({ app, base_url }) => {
			create_collections(app);
			await assert_throws_async(
				() =>
					axios.post(`${base_url}/api/v1/collections/forbidden-collection`, {
						any: "thing",
					}),
				e => assert.equal(e.response.data.message, "Noone gets in!")
			);
		}));

	it("should allow proper value when accepted by access strategy", async () =>
		with_running_app(async ({ app, base_url, rest_api }) => {
			create_collections(app);

			const response = (await axios.post(
				`${base_url}/api/v1/collections/allowed-collection`,
				{
					any: 1,
				}
			)).data;
			assert.equal(response.body.any, 1);

			const response2 = await rest_api.get(
				`/api/v1/collections/allowed-collection/${response.id}`
			);
			assert.equal(response2.body.any, 1);
		}));

	it("should not allow invalid value when access strategy allows", async () =>
		with_running_app(async ({ app, base_url }) => {
			create_collections(app);
			await assert_throws_async(
				() =>
					axios.post(`${base_url}/api/v1/collections/allowed-collection`, {
						any: "thing",
					}),
				e => {
					assert.equal(
						e.response.data.data.any.message,
						"Value 'thing' is not a int number format."
					);
				}
			);
		}));
});
