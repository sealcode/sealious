const axios = require("axios");
const assert = require("assert");

describe("simpleTemplate", () => {
	let smtp_api = null;
	before(() => (smtp_api = TestApp.ConfigManager.get("tests.smtp_api_url")));
	it("sends an email", async () => {
		await axios.delete(`${smtp_api}/messages`);
		const message = await TestApp.EmailTemplates.Simple(TestApp, {
			to: "test@example.com",
			subject: "Congratulations!",
			text: "Enlarge your 'seal' with herbal supplements",
		});
		await message.send(TestApp);
		const messages = (await axios.get(`${smtp_api}/messages`)).data;
		assert.equal(messages.length, 1);
		assert.equal(
			messages[0].sender,
			`<${TestApp.ConfigManager.get("email.from_address")}>`
		);
	});
});
