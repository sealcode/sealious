const assert = require("assert");
const locreq = require("locreq")(__dirname);
const { with_running_app } = locreq("test_utils/with-test-app.js");
const { assert_throws_async } = locreq("test_utils");

describe("request multiple ids", () => {
	it("returns proper length and empty status for empty response", async () =>
		with_running_app(async ({ app, rest_api }) => {
			const response = new app.Sealious.Responses.CollectionResponse({
				items: [],
			});

			assert.equal(response.length, 0);
			assert.equal(response.empty, true);
		}));

	it("returns proper length and empty status for nonempty response", async () =>
		with_running_app(async ({ app, rest_api }) => {
			const response = new app.Sealious.Responses.CollectionResponse({
				items: [{}, {}],
			});

			assert.equal(response.length, 2);
			assert.equal(response.empty, false);
		}));
});
