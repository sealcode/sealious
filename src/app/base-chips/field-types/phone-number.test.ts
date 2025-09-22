import assert from "assert";
import { withRunningApp } from "../../../test_utils/with-test-app.js";
import { PhoneNumberValue } from "./phone-number.js";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async.js";
import { App } from "../../app.js";
import { Collection, FieldTypes } from "../../../main.js";

describe("phone-number", () => {
	it("parses a string with multiple spaces", () =>
		withRunningApp(
			(app) => app,
			async ({ app }) => {
				const value = PhoneNumberValue.fromInput(
					new app.Context(),
					"+48 662 842 840"
				);
				assert.strictEqual(value.country_code, "48");
				assert.strictEqual(value.number, "662842840");
			}
		));

	it("throws with invalid country codes", () =>
		withRunningApp(
			(app) => app,
			async ({ app }) =>
				assertThrowsAsync(async () =>
					PhoneNumberValue.fromInput(
						new app.Context(),
						"+11111 662 842 840"
					)
				)
		));

	it("allows setting a phone number via rest_api", () =>
		withRunningApp(
			(t) =>
				class extends t {
					collections = {
						...App.BaseCollections,
						items: new (class extends Collection {
							fields = {
								phone_number: new FieldTypes.PhoneNumber(),
							};
						})(),
					};
				},

			async ({ rest_api }) => {
				await rest_api.post("/api/v1/collections/items", {
					phone_number: "+48 662 842 840",
				});
				assert.strictEqual(
					(await rest_api.get("/api/v1/collections/items")).items[0]
						.phone_number,
					"+48 662 842 840"
				);
			}
		));
});
