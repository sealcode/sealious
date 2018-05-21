const locreq = require("locreq")(__dirname);
const assert = require("assert");
const { with_running_app } = locreq("test_utils/with-test-app.js");
const assert_throws_async = locreq("test_utils/assert_throws_async.js");

describe("users", () => {
	describe("auto create admin", () => {
		it("should automatically create a registration intent for the admin user", async () =>
			with_running_app(async ({ app, mail_api }) => {
				const registration_intents = await app.run_action(
					new app.Sealious.SuperContext(),
					["collections", "registration-intents"],
					"show",
					{ filter: { email: app.manifest.admin_email } }
				);
				assert.equal(registration_intents.length, 1);
				assert.equal(registration_intents[0].body.role, "admin");
			}));
	});

	describe("users routes", () => {
		it("should correctly handle me when not logged in", async () =>
			with_running_app(async ({ app, rest_api }) => {
				await assert_throws_async(
					async () =>
						await rest_api.get(
							"/api/v1/users/me?format%5Broles%5D=expand"
						),
					e => {
						assert.equal(e.response.status, 401);
						assert.equal(
							e.response.data.message,
							"You're not logged in!"
						);
					}
				);
			}));
	});
});
