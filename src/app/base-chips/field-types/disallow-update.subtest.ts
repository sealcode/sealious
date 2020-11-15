import {
	Field,
	Context,
	Collection,
	FieldTypes,
	Policies,
} from "../../../main";

import assert from "assert";
import { withRunningApp } from "../../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async";
import { TestAppType } from "../../../test_utils/test-app";

const url = "/api/v1/collections/constseals";

class NullOrFive extends Field {
	typeName = "null-or-five";
	async isProperValue(_: Context, new_value: any, __: any) {
		if (new_value === null || new_value === 5) {
			return Field.valid();
		}
		return Field.invalid("Null or five, you got it?");
	}
}

function extend(t: TestAppType) {
	return class extends t {
		collections = {
			...t.BaseCollections,
			constseals: new (class extends Collection {
				fields = {
					age: new FieldTypes.DisallowUpdate(
						new FieldTypes.Int({ min: 0 })
					),
					attribute: new FieldTypes.DisallowUpdate(new NullOrFive()),
				};
				defaultPolicy = new Policies.Public();
			})(),
		};
	};
}

describe("disallow-update", () => {
	it("Respects target field type", () =>
		withRunningApp(extend, async ({ rest_api }) => {
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
		withRunningApp(extend, async ({ rest_api }) => {
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
		withRunningApp(extend, async ({ rest_api }) => {
			await rest_api.post(url, { age: 2, attribute: 5 });
		}));

	it("Rejects a new value if there's an old value", () =>
		withRunningApp(extend, async ({ rest_api }) => {
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
		withRunningApp(extend, async ({ rest_api }) => {
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
