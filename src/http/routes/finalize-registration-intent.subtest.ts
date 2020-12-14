import * as assert from "assert";
import tough from "tough-cookie";
import UserRoles from "../../app/collections/user-roles";
import Public from "../../app/policy-types/public";
import { App } from "../../main";
import { TestAppType } from "../../test_utils/test-app";
import { withRunningAppProd } from "../../test_utils/with-test-app";

describe("finalize registration", () => {
	it("allows to register an account (entire flow)", async () =>
		withRunningAppProd(
			//using prod to not skip html generation - see templates/simple.ts
			(t: TestAppType) =>
				class extends t {
					collections = {
						...App.BaseCollections,
						"user-roles": new UserRoles().setPolicy(
							"create",
							new Public()
						),
					};
				},
			async ({ app, mail_api, rest_api }) => {
				app.ConfigManager.set("roles", ["admin"]);
				const cookieJar = new tough.CookieJar();
				const options = {
					jar: cookieJar,
					withCredentials: true,
				};
				await rest_api.post(
					"/api/v1/collections/registration-intents",
					{ email: "user@example.com", role: "admin" },
					options
				);
				const message_metadata = (await mail_api.getMessages()).filter(
					(message) => message.recipients[0] == "<user@example.com>"
				)[0];
				assert.ok(message_metadata?.subject);

				const message = await mail_api.getMessageById(
					message_metadata.id
				);
				const match_result = message.match(/token=([^?&]+)/);
				if (!match_result) {
					throw new Error("Didn't find a token");
				}
				const token = match_result[1];

				await rest_api.post("/finalize-registration-intent", {
					email: "user@example.com",
					token,
					password: "password",
					username: "user",
				});

				await rest_api.post(
					"/api/v1/sessions",
					{ username: "user", password: "password" },
					options
				);

				const response = await rest_api.get(
					"/api/v1/users/me?attachments[roles]=true",
					options
				);
				assert.equal(response.items[0].roles.length, 1);
				assert.equal(
					response.attachments[response.items[0].roles[0]].role,
					"admin"
				);
			}
		));
});
