const assert = require("assert");
const tough = require("tough-cookie");
const { promise_timeout, assert_throws_async } = require("../../../test_utils");
const {
	with_running_app,
	with_running_app_prod,
} = require("../../../test_utils/with-test-app.js");

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
		with_running_app_prod(async ({ app, mail_api, rest_api }) => {
			await create_a_user(app);
			const cookieJar = new tough.CookieJar();
			const options = {
				jar: cookieJar,
				withCredentials: true,
			};

			await rest_api.post(
				"/api/v1/sessions",
				{ username: "user", password: "password" },
				options
			);
			await rest_api.delete("/api/v1/sessions/current", options);
			await rest_api.post("/api/v1/collections/password-reset-intents", {
				email: "user@example.com",
			});

			const message_metadata = (await mail_api.get_messages()).filter(
				(message) => message.recipients[0] == "<user@example.com>"
			)[0];
			assert(message_metadata.subject);

			const message = await mail_api.get_message_by_id(
				message_metadata.id
			);

			const token = message.match(/token=([^?&]+)/)[1];
			await rest_api.post("/finalize-password-reset", {
				email: "user@example.com",
				token,
				password: "new-password",
			});
			await rest_api.post(
				"/api/v1/sessions",
				{ username: "user", password: "new-password" },
				options
			);

			await assert_throws_async(
				async () =>
					rest_api.post("/finalize-password-reset", {
						email: "user@example.com",
						token,
						password: "using the same token twice hehehehhee",
					}),
				() => {}
			);
		}));
});
