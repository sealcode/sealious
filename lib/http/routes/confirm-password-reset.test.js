const locreq = require("locreq")(__dirname);
const axios = require("axios");
const assert = require("assert");
const with_test_app = locreq("test_utils/with-test-app.js");

describe("confirm-password-reset", () => {
	it("displays an html form", async () =>
		with_test_app(async ({ app, base_url }) => {
			const response = await axios.get(
				`${base_url}/confirm-password-reset?token=kupcia&email=dupcia`
			);
		}));
});
