const locreq = require("locreq")(__dirname);
const assert = require("assert");
const { with_running_app } = locreq("test_utils/with-test-app.js");

describe("simpleTemplate", () => {
	it("sends an email", async () =>
		with_running_app(async ({ app, mail_api }) => {
			const message = await app.EmailTemplates.Simple(app, {
				to: "test@example.com",
				subject: "Congratulations!",
				text: "Enlarge your 'seal' with herbal supplements",
			});
			await message.send(app);
			const messages = await mail_api.get_messages();
			assert.equal(messages.length, 1);
			assert.equal(
				messages[0].sender,
				`<${app.ConfigManager.get("email.from_address")}>`
			);
		}));
});
