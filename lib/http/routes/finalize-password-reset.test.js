const locreq = require("locreq")(__dirname);
const assert = require("assert");
const axios = require("axios");
const tough = require("tough-cookie");
const { promise_timeout, assert_throws_async } = locreq("test_utils");
const { with_running_app } = locreq("test_utils/with-test-app.js");

describe("finalize password reset", () => {
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

	it("allows to change a password (entire flow)", async () =>
		with_running_app(async ({ app, base_url, mail_api }) => {
			await create_a_user(app);
			const cookieJar = new tough.CookieJar();
			const options = {
				jar: cookieJar,
				withCredentials: true,
			};

			await axios.post(
				`${base_url}/api/v1/sessions`,
				{ username: "user", password: "password" },
				options
			);
			await axios.delete(`${base_url}/api/v1/sessions/current`, options);
			await axios.post(
				`${base_url}/api/v1/collections/password-reset-intents`,
				{
					email: "user@example.com",
				}
			);

			const message_metadata = (await mail_api.get_messages()).filter(
				message => message.recipients[0] == "<user@example.com>"
			)[0];
			assert(message_metadata.subject);

			const message = await mail_api.get_message_by_id(
				message_metadata.id
			);

			const token = message.match(/token=([^?&]+)/)[1];
			await axios.post(`${base_url}/finalize-password-reset`, {
				email: "user@example.com",
				token,
				password: "new-password",
			});
			await axios.post(
				`${base_url}/api/v1/sessions`,
				{ username: "user", password: "new-password" },
				options
			);

			await assert_throws_async(
				async () =>
					axios.post(`${base_url}/finalize-password-reset`, {
						email: "user@example.com",
						token,
						password: "using the same token twice hehehehhee",
					}),
				() => {}
			);
		}));
});
