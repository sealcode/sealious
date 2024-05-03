import {
	Field,
	Context,
	Collection,
	FieldTypes,
	Policies,
} from "../../../main.js";

import assert from "assert";
import {
	TestAppConstructor,
	withRunningApp,
} from "../../../test_utils/with-test-app.js";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async.js";
import { TestApp } from "../../../test_utils/test-app.js";

const url = "/api/v1/collections/constseals";

class NullOrFive extends Field<number> {
	typeName = "null-or-five";
	async isProperValue(_: Context, new_value: any, __: any) {
		if (new_value === null || new_value === 5) {
			return Field.valid();
		}
		return Field.invalid("Null or five, you got it?");
	}
}

function extend(t: TestAppConstructor) {
	return class extends t {
		collections = {
			...TestApp.BaseCollections,
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
		withRunningApp(extend, async ({ app, rest_api }) => {
			const age = "abc";
			await assertThrowsAsync(
				() => rest_api.post(url, { age: "abc", attribute: 5 }),
				(error) => {
					assert.deepStrictEqual(
						error.response.data.data.field_messages.age.message,
						app.i18n("invalid_integer", [age])
					);
				}
			);
		}));

	it("Respects target field params", () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			const age = -2;
			await assertThrowsAsync(
				() => rest_api.post(url, { age: age }),
				(error) =>
					assert.deepEqual(
						error.response.data.data.field_messages.age.message,
						app.i18n("too_small_integer", [age, 0])
					)
			);
		}));

	it("Initially allows to insert a value", () =>
		withRunningApp(extend, async ({ rest_api }) => {
			await rest_api.post(url, { age: 2, attribute: 5 });
		}));

	it("Rejects a new value if there's an old value", () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			const { id } = await rest_api.post(url, {
				age: 18,
				attribute: null,
			});
			await assertThrowsAsync(
				() => rest_api.patch(`${url}/${id}`, { age: 21 }),
				(error) =>
					assert.deepEqual(
						error.response.data.data.field_messages.age.message,
						app.i18n("invalid_update")
					)
			);
		}));

	it("Rejects a new value if the old value is `null`", () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			const { id } = await rest_api.post(url, {
				age: 21,
				attribute: null,
			});
			await assertThrowsAsync(
				() => rest_api.patch(`${url}/${id}`, { attribute: 5 }),
				(error) => {
					assert.deepEqual(
						error.response.data.data.field_messages.attribute
							.message,
						app.i18n("invalid_update")
					);
				}
			);
		}));
});
