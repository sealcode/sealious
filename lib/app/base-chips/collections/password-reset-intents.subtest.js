const axios = require("axios");
const assert = require("assert");
const { promise_timeout } = require("../../../../test_utils");
const {
	with_running_app,
	with_running_app_prod,
} = require("../../../../test_utils/with-test-app.js");

describe("password-reset-intents", () => {
	async function create_a_user(app) {
		await app.run_action(
			new app.Sealious.SuperContext(),
			["collections", "users"],
			"create",
			{
				username: "user",
				email: "user@example.com",
				password: "password",
			}
		);
	}

	it("tells you if the email address doesn't exist", async () =>
		with_running_app(async ({ app, base_url }) => {
			try {
				await axios.post(
					`${base_url}/api/v1/collections/password-reset-intents`,
					{
						email: "fake@example.com",
					}
				);
			} catch (e) {
				assert.equal(
					e.response.data.data.email.message,
					"No users with email set to fake@example.com"
				);
				return;
			}
			throw new Error("it didn't throw");
		}));

	it("allows anyone to create an intent, if the email exists", async () =>
		with_running_app(async ({ app, base_url }) => {
			await create_a_user(app);
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
		with_running_app(async ({ base_url }) => {
			try {
				await axios.post(
					`${base_url}/api/v1/collections/password-reset-intents`,
					{
						email: "incorrect-address",
					}
				);
			} catch (e) {
				assert.equal(
					e.response.data.data.email.message,
					"incorrect-address is a not valid e-mail address."
				);
				return;
			}
			throw new Error("it didn't throw");
		}));

	it("sends an email with the reset password link", async () =>
		with_running_app_prod(async ({ app, base_url, mail_api }) => {
			await create_a_user(app);
			const data = (
				await axios.post(
					`${base_url}/api/v1/collections/password-reset-intents`,
					{
						email: "user@example.com",
					}
				)
			).data;
			const messages = (await mail_api.get_messages()).filter(
				(message) => message.recipients[0] == "<user@example.com>"
			);
			assert(messages.length, 1);
			assert.equal(messages[0].recipients.length, 1);
			assert.equal(messages[0].recipients[0], "<user@example.com>");
		}));
});
