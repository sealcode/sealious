const locreq = require("locreq")(__dirname);
const assert = require("assert");
const { with_running_app } = locreq("test_utils/with-test-app.js");

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
});
