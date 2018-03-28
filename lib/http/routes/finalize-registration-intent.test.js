const locreq = require("locreq")(__dirname);
const assert = require("assert");
const axios = require("axios");
const tough = require("tough-cookie");
const { promise_timeout, assert_throws_async } = locreq("test_utils");
const { with_running_app } = locreq("test_utils/with-test-app.js");

describe("finalize registration", () => {
	it("allows to register an account (entire flow)", async () =>
		with_running_app(async ({ app, base_url, mail_api }) => {
			const cookieJar = new tough.CookieJar();
			const options = {
				jar: cookieJar,
				withCredentials: true,
			};

			await axios.post(
				`${base_url}/api/v1/collections/registration-intents`,
				{ email: "user@example.com" },
				options
			);

			const message = await mail_api.get_message_by_id(1);
			const token = message.match(/token=([^?&]+)/)[1];

			await axios.post(`${base_url}/finalize-registration-intent`, {
				email: "user@example.com",
				token,
				password: "password",
				username: "user",
			});

			await axios.post(
				`${base_url}/api/v1/sessions`,
				{ username: "user", password: "password" },
				options
			);
		}));
});
