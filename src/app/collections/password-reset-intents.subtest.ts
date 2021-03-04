import axios from "axios";
import assert from "assert";
import {
	withRunningApp,
	withRunningAppProd,
} from "../../test_utils/with-test-app";
import { App } from "../../main";

describe("password-reset-intents", () => {
	async function createAUser(app: App) {
		await app.collections.users.suCreate({
			username: "user",
			email: "user@example.com",
			password: "password",
			roles: [],
		});
	}

	it("tells you if the email address doesn't exist", async () =>
		withRunningApp(null, async ({ app, base_url }) => {
			const email = "fake@example.com";
			try {
				await axios.post(
					`${base_url}/api/v1/collections/password-reset-intents`,
					{
						email: email,
					}
				);
			} catch (e) {
				assert.equal(
					e.response.data.data.email.message,
					app.i18n("invalid_existing_value", [
						"users",
						"email",
						email,
					])
				);
				return;
			}
			throw new Error("it didn't throw");
		}));

	it("allows anyone to create an intent, if the email exists", async () =>
		withRunningApp(null, async ({ app, base_url }) => {
			await createAUser(app);
			const { email, token } = (
				await axios.post(
					`${base_url}/api/v1/collections/password-reset-intents`,
					{
						email: "user@example.com",
					}
				)
			).data;
			assert.deepEqual(
				{ email, token },
				{
					email: "user@example.com",
					token: "it's a secret to everybody",
				}
			);
		}));

	it("tells you if the email address is malformed", async () =>
		withRunningApp(null, async ({ app, base_url }) => {
			const email = "incorrect-address";
			try {
				await axios.post(
					`${base_url}/api/v1/collections/password-reset-intents`,
					{
						email: email,
					}
				);
			} catch (e) {
				assert.equal(
					e.response.data.data.email.message,
					app.i18n("invalid_email", [email])
				);
				return;
			}
			throw new Error("it didn't throw");
		}));

	it("sends an email with the reset password link", async () =>
		withRunningAppProd(null, async ({ app, base_url, mail_api }) => {
			await createAUser(app);
			await axios.post(
				`${base_url}/api/v1/collections/password-reset-intents`,
				{
					email: "user@example.com",
				}
			);

			const messages = (await mail_api.getMessages()).filter(
				(message) => message.recipients[0] == "<user@example.com>"
			);
			assert.equal(messages.length, 1);
			assert.equal(messages[0].recipients.length, 1);
			assert.equal(messages[0].recipients[0], "<user@example.com>");
		}));
});
