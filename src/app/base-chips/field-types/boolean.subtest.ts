import assert from "assert";
import { withRunningApp } from "../../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async";
import { App, Collection, FieldTypes, Policies } from "../../../main";
import { TestAppType } from "../../../test_utils/test-app";

const URL = "/api/v1/collections/boolseals";

function extend(t: TestAppType) {
	const boolseals = new (class extends Collection {
		name = "boolseals";
		fields = {
			is_old: new FieldTypes.Boolean(),
		};
		defaultPolicy = new Policies.Public();
	})();
	return class extends t {
		collections = {
			...App.BaseCollections,
			boolseals,
		};
	};
}

describe("boolean", () => {
	it("Allows to insert values considered correct", () =>
		withRunningApp(extend, async ({ rest_api }) => {
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
		withRunningApp(extend, async ({ rest_api }) => {
			await assertThrowsAsync(
				() => rest_api.post(`${URL}`, { is_old: undefined }),
				(error) =>
					assert.deepEqual(
						error.response.data.data.is_old.message,
						"Missing value for field 'is_old'"
					)
			);
		}));
	it("Doesn't let '' in", () =>
		withRunningApp(extend, async ({ rest_api }) => {
			await assertThrowsAsync(
				() => rest_api.post(`${URL}`, { is_old: "" }),
				(error) => {
					assert.equal(error.response.status, 403);
					assert.deepEqual(
						error.response.data.data.is_old.message,
						"Value '' is not boolean format."
					);
				}
			);
		}));
	it("Doesn't let unwelcomed values in", () =>
		withRunningApp(extend, async ({ rest_api }) => {
			const cases = [
				[null, "Value 'null' is not boolean format."],
				[{}, "Value '[object Object]' is not boolean format."],
				[[], "Value '' is not boolean format."],
				[[false], "Value 'false' is not boolean format."],
				[{ a: true }, "Value '[object Object]' is not boolean format."],
			];

			await Promise.all(
				cases.map(([value, error_message]) =>
					assertThrowsAsync(
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
