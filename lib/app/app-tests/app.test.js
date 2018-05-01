const locreq = require("locreq")(__dirname);
const assert = require("assert");
const { with_stopped_app } = locreq("test_utils/with-test-app.js");

describe("app", () => {
	it("Should allow overwriting the response after handling an event", async () =>
		with_stopped_app(async ({ app }) => {
			app.on(
				"post:collections.users:create",
				() => new app.Sealious.OverwriteResponse("I am a happy seal")
			);

			await app.start();

			const response = await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "users"],
				"create",
				{
					username: "seal",
					password: "seal",
					email: "seal@sealious.com",
				}
			);

			assert.equal(response, "I am a happy seal");

			await app.stop();
		}));
});
