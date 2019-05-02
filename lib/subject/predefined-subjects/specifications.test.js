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
});
