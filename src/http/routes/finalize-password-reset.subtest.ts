import assert from "assert";
import tough from "tough-cookie";
import { assertThrowsAsync } from "../../test_utils/assert-throws-async";
import { withRunningAppProd } from "../../test_utils/with-test-app";
import { App } from "../../main";

describe("finalize password reset", () => {
	async function createAUser(app: App) {
		await app.collections.users.suCreate({
			username: "user",
			email: "user@example.com",
			password: "password",
			roles: [],
		});
	}

	it("allows to change a password (entire flow)", async () =>
		withRunningAppProd(null, async ({ app, mail_api, rest_api }) => {
			await createAUser(app);
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

			const message_metadata = (await mail_api.getMessages()).filter(
				(message) => message.recipients[0] == "<user@example.com>"
			)[0];
			assert(message_metadata.subject);

			const message = await mail_api.getMessageById(message_metadata.id);

			const matches = message.match(/token=([^?&]+)/);
			if (!matches) {
				throw new Error("token not found in the message");
			}
			const token = matches[1];
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

			await assertThrowsAsync(
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
