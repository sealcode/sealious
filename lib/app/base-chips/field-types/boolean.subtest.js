const assert = require("assert");
const { with_running_app } = require("../../../../test_utils/with-test-app.js");
const assert_throws_async = require("../../../../test_utils/assert_throws_async.js");

const URL = "/api/v1/collections/boolseals";

describe("boolean", () => {
	async function setup(App) {
		App.createChip(App.Sealious.Collection, {
			name: "boolseals",
			fields: [
				{
					name: "is_old",
					type: "boolean",
					required: true,
				},
			],
			access_strategy: {
				default: "public",
			},
		});
	}
	it("Allows to insert values considered correct", () =>
		with_running_app(async ({ app, rest_api }) => {
			await setup(app);

			const cases = [
				[true, true],
				[false, false],
				["true", true],
				["false", false],
				["1", true],
				["0", false],
				[1, true],
				[0, false],
			];

			await Promise.all(
				cases.map(async ([field_value, saved_value]) => {
					const { is_old } = await rest_api.post(URL, {
						is_old: field_value,
					});
					assert.equal(is_old, saved_value);
				})
			);
		}));

	it("Doesn't let undefined in", () =>
		with_running_app(async ({ app, rest_api }) => {
			await setup(app);
			await assert_throws_async(
				() => rest_api.post(`${URL}`, { is_old: undefined }),
				(error) =>
					assert.deepEqual(
						error.response.data.data.is_old.message,
						"Missing value for field 'is_old'"
					)
			);
		}));
	it("Doesn't let '' in", () =>
		with_running_app(async ({ app, rest_api }) => {
			await setup(app);
			await assert_throws_async(
				() => rest_api.post(`${URL}`, { is_old: "" }),
				(error) => {
					assert.equal(error.response.status, 403);
					assert.deepEqual(
						error.response.data.data.is_old.message,
						"Missing value for required field: 'is_old'"
					);
				}
			);
		}));
	it("Doesn't let unwelcomed values in", () =>
		with_running_app(async ({ app, rest_api }) => {
			await setup(app);
			const cases = [
				[null, "Value 'null' is not boolean format."],
				[{}, "Value '[object Object]' is not boolean format."],
				[[], "Value '' is not boolean format."],
				[[false], "Value 'false' is not boolean format."],
				[{ a: true }, "Value '[object Object]' is not boolean format."],
			];

			await Promise.all(
				cases.map(([value, error_message]) =>
					assert_throws_async(
						() => rest_api.post(`${URL}`, { is_old: value }),
						(error) => {
							assert.equal(error.response.status, 403);
							assert.deepEqual(
								error.response.data.data.is_old.message,
								error_message
							);
						}
					)
				)
			);
		}));
});
