import assert from "assert";
import { withRunningAppProd } from "../../test_utils/with-test-app";
import SimpleTemplate from "./simple";

describe("simpleTemplate", () => {
	it("sends an email", async () =>
		withRunningAppProd(null, async ({ app, mail_api }) => {
			await mail_api.deleteAllInstanceEmails();
			const message = await SimpleTemplate(app, {
				to: "test@example.com",
				subject: "Congratulations!",
				text: "Enlarge your 'seal' with herbal supplements",
			});
			await message.send(app);
			const messages = await mail_api.getMessages();
			assert.strictEqual(messages.length, 1);
			assert.strictEqual(
				messages[0].sender,
				`<${app.ConfigManager.get("email").from_address}>`
			);
		}));
});
