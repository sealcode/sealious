const axios = require("axios");

describe("confirm-password-reset", () => {
	it("displays an html form", async () => {
		const response = await axios.get(
			`${
				TestApp.manifest.base_url
			}/confirm-password-reset?token=kupcia&email=dupcia`
		);
	});
});
