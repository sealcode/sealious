import {
	App,
	Field,
	Context,
	Collection,
	FieldTypes,
	AccessStrategies,
	FieldDefinitionHelper as field,
} from "../../../main";

import assert from "assert";
import { withRunningApp } from "../../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async";

const url = "/api/v1/collections/constseals";

describe("disallow-update", () => {
	async function setup(app: App) {
		class NullOrFive extends Field {
			getTypeName = () => "null-or-five";
			async isProperValue(_: Context, new_value: any, __: any) {
				if (new_value === null || new_value === 5) {
					return Field.valid();
				}
				return Field.invalid("Null or five, you got it?");
			}
		}
		Collection.fromDefinition(app, {
			name: "constseals",
			fields: [
				field(
					"age",
					FieldTypes.DisallowUpdate,
					{
						base_field_type: FieldTypes.Int,
						base_field_params: {
							min: 0,
						},
					},
					true
				),
				field(
					"attribute",
					FieldTypes.DisallowUpdate,
					{
						base_field_type: NullOrFive,
						base_field_params: {},
					},
					true
				),
			],
			access_strategy: {
				default: AccessStrategies.Public,
			},
		});
	}

	it("Respects target field type", () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app);
			await assertThrowsAsync(
				() => rest_api.post(url, { age: "abc", attribute: 5 }),
				(error) => {
					assert.deepEqual(
						error.response.data.data.age.message,
						"Value 'abc' is not a int number format."
					);
				}
			);
		}));

	it("Respects target field params", () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app);
			await assertThrowsAsync(
				() => rest_api.post(url, { age: -2 }),
				(error) =>
					assert.deepEqual(
						error.response.data.data.age.message,
						"Value -2 should be larger than or equal to 0"
					)
			);
		}));

	it("Initially allows to insert a value", () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app);
			await rest_api.post(url, { age: 2, attribute: 5 });
		}));

	it("Rejects a new value if there's an old value", () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app);
			const { id } = await rest_api.post(url, {
				age: 18,
				attribute: null,
			});
			await assertThrowsAsync(
				() => rest_api.patch(`${url}/${id}`, { age: 21 }),
				(error) =>
					assert.deepEqual(
						error.response.data.data.age.message,
						"You cannot change a previously set value"
					)
			);
		}));

	it("Rejects a new value if the old value is `null`", () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app);
			const { id } = await rest_api.post(url, {
				age: 21,
				attribute: null,
			});
			await assertThrowsAsync(
				() => rest_api.patch(`${url}/${id}`, { attribute: 5 }),
				(error) =>
					assert.deepEqual(
						error.response.data.data.attribute.message,
						"You cannot change a previously set value"
					)
			);
		}));
});
