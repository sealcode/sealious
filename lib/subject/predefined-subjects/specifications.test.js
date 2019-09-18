const locreq = require("locreq")(__dirname);
const axios = require("axios");
const assert = require("assert");

const { with_running_app, with_stopped_app } = locreq(
	"test_utils/with-test-app.js"
);

describe("specifications endpoint", () => {
	it("returns a list of collections", async () => {
		await with_running_app(async ({ base_url }) => {
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
				],
				result.map(collection_spec => collection_spec.name)
			);
		});
	});

	it("contains information on whether or not a field is required", async () => {
		await with_running_app(async ({ base_url }) => {
			const { data: result } = await axios.get(
				`${base_url}/api/v1/specifications`
			);
			assert.notEqual(
				result.filter(collection => collection.name === "users")[0]
					.fields.username.required,
				undefined
			);
		});
	});

	it("contains display_hints when provided", async function() {
		await with_running_app(async ({ app, rest_api }) => {
			app.createChip(app.Sealious.Collection, {
				name: "foo",
				fields: [{ name: "bar", type: "text" }],
				display_hints: "A hint",
			});

			const specifications = await rest_api.get("/api/v1/specifications");
			const does_every_element_have_dh = specifications.every(
				e => e.display_hints
			);
			assert.ok(does_every_element_have_dh);
			const created_collection = specifications.find(
				e => e.name === "foo"
			);
			assert.equal(created_collection.display_hints, "A hint");
		});
	});
});
