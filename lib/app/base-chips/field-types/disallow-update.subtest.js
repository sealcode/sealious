const assert = require("assert");
const locreq = require("locreq")(__dirname);
const { with_running_app } = locreq("test_utils/with-test-app.js");
const assert_throws_async = locreq("test_utils/assert_throws_async.js");

const URL = "/api/v1/collections/constseals";

describe("disallow-update", () => {
	async function setup(App) {
		App.createChip(App.Sealious.FieldType, {
			name: "null-or-five",
			is_proper_value: (context, params, new_value, old_value) => {
				if (new_value === null || new_value === 5) {
					return Promise.resolve();
				}
				return Promise.reject("Null or five, you got it?");
			},
		});
		App.createChip(App.Sealious.Collection, {
			name: "constseals",
			fields: [
				{
					name: "age",
					type: "disallow-update",
					params: {
						target_field: {
							type: "int",
							params: {
								min: 0,
							},
						},
					},
					required: true,
				},
				{
					name: "attribute",
					type: "disallow-update",
					params: {
						target_field: {
							type: "null-or-five",
						},
					},
					required: true,
				},
			],
			access_strategy: {
				default: "public",
			},
		});
	}

	it("Respects target field type", () =>
		with_running_app(async ({ app, rest_api, base_url }) => {
			await setup(app);
			await assert_throws_async(
				() => rest_api.post(URL, { age: "abc", attribute: 5 }),
				error => {
					assert.deepEqual(
						error.response.data.data.age.message,
						"Value 'abc' is not a int number format."
					);
				}
			);
		}));

	it("Respects target field params", () =>
		with_running_app(async ({ app, rest_api, base_url }) => {
			await setup(app);
			await assert_throws_async(
				() => rest_api.post(URL, { age: -2 }),
				error =>
					assert.deepEqual(
						error.response.data.data.age.message,
						"Value should be larger or equal to '0'."
					)
			);
		}));

	it("Initially allows to insert a value", () =>
		with_running_app(async ({ app, rest_api, base_url }) => {
			await setup(app);
			await rest_api.post(URL, { age: 2, attribute: 5 });
		}));

	it("Rejects a new value if there's an old value", () =>
		with_running_app(async ({ app, rest_api, base_url }) => {
			await setup(app);
			const { id } = await rest_api.post(URL, {
				age: 18,
				attribute: null,
			});
			await assert_throws_async(
				() => rest_api.patch(`${URL}/${id}`, { age: 21 }),
				error =>
					assert.deepEqual(
						error.response.data.data.age.message,
						"You cannot change previously set value."
					)
			);
		}));

	it("Rejects a new value if the old value is `null`", () =>
		with_running_app(async ({ app, rest_api, base_url }) => {
			await setup(app);
			const { id } = await rest_api.post(URL, {
				age: 21,
				attribute: null,
			});
			await assert_throws_async(
				() => rest_api.patch(`${URL}/${id}`, { attribute: 5 }),
				error =>
					assert.deepEqual(
						error.response.data.data.attribute.message,
						"You cannot change previously set value."
					)
			);
		}));
});
