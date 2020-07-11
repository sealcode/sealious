import axios from "axios";
import assert from "assert";

import { withRunningApp } from "../../test_utils/with-test-app";
import { Collection, FieldTypes } from "../../main";

describe("specifications endpoint", () => {
	it("returns a list of collections", async () => {
		await withRunningApp(async ({ base_url }) => {
			const { data: result } = await axios.get(
				`${base_url}/api/v1/specifications`
			);
			assert.deepEqual(
				[
					"user-roles",
					"users",
					"sessions",
					"anonymous-sessions",
					"formatted-images",
					"password-reset-intents",
					"registration-intents",
				].sort(),
				result
					.map((collection_spec: any) => collection_spec.name)
					.sort()
			);
		});
	});

	it("contains information on whether or not a field is required", async () => {
		await withRunningApp(async ({ base_url }) => {
			const { data: result } = await axios.get(
				`${base_url}/api/v1/specifications`
			);
			assert.notEqual(
				result.filter(
					(collection: any) => collection.name === "users"
				)[0].fields.username.required,
				undefined
			);
		});
	});

	it("contains display_hints when provided", async function () {
		await withRunningApp(async ({ app, rest_api }) => {
			Collection.fromDefinition(app, {
				name: "foo",
				fields: [{ name: "bar", type: FieldTypes.Text }],
				display_hints: "A hint",
			});

			const specifications = await rest_api.get("/api/v1/specifications");
			const does_every_element_have_dh = specifications.every(
				(e: any) => e.display_hints
			);
			assert.ok(does_every_element_have_dh);
			const created_collection = specifications.find(
				(e: any) => e.name === "foo"
			);
			assert.equal(created_collection.display_hints, "A hint");
		});
	});
});
