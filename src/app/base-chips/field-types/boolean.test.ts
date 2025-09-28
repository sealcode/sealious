import assert from "assert";
import {
	type TestAppConstructor,
	withRunningApp,
} from "../../../test_utils/with-test-app.js";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async.js";
import { App, Collection, FieldTypes, Policies } from "../../../main.js";

const URL = "/api/v1/collections/boolseals";

function extend(t: TestAppConstructor) {
	const boolseals = new (class extends Collection {
		name = "boolseals";
		fields = {
			is_old: FieldTypes.Required(new FieldTypes.Boolean()),
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
	it("Allows to insert values considered correct", async () =>
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

			for (const [field_value, saved_value] of cases) {
				const { is_old } = await rest_api.post(URL, {
					is_old: field_value,
				});
				assert.equal(
					is_old,
					saved_value,
					`While entering ${field_value}, the stored value should be ${saved_value}, but was ${is_old}`
				);
			}
		}));

	it("Doesn't let undefined in", () =>
		withRunningApp(extend, async ({ rest_api }) => {
			await assertThrowsAsync(
				() => rest_api.post(`${URL}`, { is_old: undefined }),
				(error) =>
					assert.deepEqual(
						error.response.data.data.field_messages.is_old.message,
						"Missing value for field 'is_old'."
					)
			);
		}));

	it("Doesn't let '' in", () =>
		withRunningApp(extend, async ({ rest_api }) => {
			await assertThrowsAsync(
				() => rest_api.post(`${URL}`, { is_old: "" }),
				(error) => {
					assert.strictEqual(error.response.status, 403);
					assert.deepStrictEqual(
						error.response.data.data.field_messages.is_old.message,
						`Value '${""}' is not boolean format.`
					);
				}
			);
		}));

	it("Doesn't let unwelcomed values in", () =>
		withRunningApp(extend, async ({ rest_api }) => {
			const cases = [
				[null, "Missing value for field 'is_old'."],
				[{}, `Value '${String({})}' is not boolean format.`],
				[[], `Value '${[]}' is not boolean format.`],
				[[false], `Value '${[false]}' is not boolean format.`],
				[{ a: true }, `Value '${{ a: true }}' is not boolean format.`],
			];

			await Promise.all(
				cases.map(([value, error_message]) =>
					assertThrowsAsync(
						() => rest_api.post(`${URL}`, { is_old: value }),
						(error) => {
							assert.equal(error.response.status, 403);
							assert.deepEqual(
								error.response.data.data.field_messages.is_old
									.message,
								error_message
							);
						}
					)
				)
			);
		}));

	it("lets filter by literal false value", () =>
		withRunningApp(extend, async ({ app }) => {
			await app.collections.boolseals.suCreate({
				is_old: true,
			});
			await app.collections.boolseals.suCreate({
				is_old: false,
			});
			const { items: seals } = await app.collections.boolseals
				.suList()
				.filter({ is_old: false })
				.fetch();
			assert.strictEqual(seals.length, 1);
		}));
});
