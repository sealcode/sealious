import {
	Field,
	Context,
	Collection,
	FieldTypes,
	Policies,
	App,
	CollectionItem,
	type ValidationResult,
} from "../../../main.js";

import assert from "assert";
import {
	type TestAppConstructor,
	withRunningApp,
} from "../../../test_utils/with-test-app.js";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async.js";
import { TestApp } from "../../../test_utils/test-app.js";
import { OpenApiTypes } from "../../../schemas/open-api-types.js";
import DisallowUpdate from "./disallow-update.js";

const url = "/api/v1/collections/constseals";

class NullOrFive extends Field<number> {
	typeName = "null-or-five";
	open_api_type = OpenApiTypes.NONE;
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
						"Value 'abc' is not a int number format."
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
						"Value -2 should be larger than or equal to 0."
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
						`You cannot change a previously set value.`
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
						`You cannot change a previously set value.`
					);
				}
			);
		}));

	it("rejects a new null value if the old value is non-null", () =>
		withRunningApp(extend, async ({ app }) => {
			const item = await app.collections.constseals.create(
				new app.Context(),
				{
					age: 33,
					attribute: 5,
				}
			);
			item.set("age", null);
			await assertThrowsAsync(() => item.save(new app.Context()));
		}));

	it("rejects a new null value if the old value is non-null", () =>
		withRunningApp(
			(t) =>
				class extends t {
					collections = {
						...App.BaseCollections,
						numbers: new (class extends Collection {
							fields = {
								value: new DisallowUpdate(
									new (class extends Field<number> {
										typeName: "number-with-context";
										open_api_type: OpenApiTypes;
										async isProperValue(
											context: Context
										): Promise<ValidationResult> {
											if (!context.user_id) {
												return {
													valid: false,
													reason: "User id missing",
												};
											}
											return { valid: true };
										}
									})()
								),
							};
						})(),
					};
				},
			async ({ app }) => {
				const item = await app.collections.numbers.create(
					new app.Context({ user_id: "some-user" }),
					{ value: 42 }
				);
			}
		));
});
