const axios = require("axios");
const assert = require("assert");
const { with_running_app } = require("../../../test_utils/with-test-app.js");

describe("confirm-password-reset", () => {
	it("displays an html form", async () =>
		with_running_app(async ({ app, base_url }) => {
			const response = await axios.get(
				`${base_url}/confirm-password-reset?token=kupcia&email=dupcia`
			);
		}));
});
