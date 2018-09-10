const locreq = require("locreq")(__dirname);
const axios = require("axios");
const assert = require("assert");
const { with_running_app } = locreq("test_utils/with-test-app.js");
const { assert_throws_async } = require("../../../test_utils");

describe("account-creation-details", () => {
	it("throws when no token/email is present", () =>
		with_running_app(({ app, base_url }) =>
			assert_throws_async(
				async () => {
					await axios.get(`${base_url}/account-creation-details`);
				},
				e => {}
			)
		));
	it("displays an html form after the positive flow", () =>
		with_running_app(async ({ app, base_url }) => {
			const resp = await axios.get(
				`${base_url}/account-creation-details?token=oieajgoiea&email=ababab@ok.pl`
			);
			assert.deepEqual(resp.status, 200);
			assert(resp.data.length);
		}));
});
