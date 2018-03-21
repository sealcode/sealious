const locreq = require("locreq")(__dirname);
const axios = require("axios");
const assert = require("assert");
const { promise_timeout } = locreq("test_utils");

describe("password-reset-intents", () => {
	let app = null;
	const port = 8888;
	const base_url = `http://localhost:${port}/api/v1`;
	let smtp_api = null;
	before(() => (smtp_api = TestApp.ConfigManager.get("tests.smtp_api_url")));

	beforeEach(async () => {
		app = new Sealious.App(
			{
				"www-server": { port: 8888 },
				upload_path: "/dev/null",
				logger: { level: "emerg" },
				core: { environment: "production" },
				smtp: TestApp.ConfigManager.get("smtp"),
				datastore_mongo: TestApp.ConfigManager.get("datastore_mongo"),
			},
			TestApp.manifest
		);

		await app.start();
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
		await axios.delete(`${smtp_api}/messages`);
	});

	it("tells you if the email address doesn't exist", async () => {
		try {
			await axios.post(`${base_url}/collections/password-reset-intents`, {
				email: "fake@example.com",
			});
		} catch (e) {
			assert.equal(
				e.response.data.data.email.message,
				"No users with email set to fake@example.com"
			);
			return;
		}
		throw new Error("it didn't throw");
	});

	it("allows anyone to create an intent, if the email exists", async () => {
		const data = (await axios.post(
			`${base_url}/collections/password-reset-intents`,
			{
				email: "user@example.com",
			}
		)).data;
		assert.deepEqual(data.body, {
			email: "user@example.com",
			token: "it's a secret to everybody",
		});
	});

	it("tells you if the email address is malformed", async () => {
		try {
			await axios.post(`${base_url}/collections/password-reset-intents`, {
				email: "incorrect-address",
			});
		} catch (e) {
			assert.equal(
				e.response.data.data.email.message,
				"incorrect-address is a not valid e-mail address."
			);
			return;
		}
		throw new Error("it didn't throw");
	});

	it("sends an email with the reset password link", async () => {
		const data = (await axios.post(
			`${base_url}/collections/password-reset-intents`,
			{
				email: "user@example.com",
			}
		)).data;
		const messages = (await axios.get(`${smtp_api}/messages`)).data;
		assert.equal(messages.length, 1);
		assert.equal(messages[0].recipients.length, 1);
		assert.equal(messages[0].recipients[0], "<user@example.com>");
	});

	afterEach(async () => {
		await Promise.all(
			app.ChipManager.get_all_collections().map(collection_name =>
				app.Datastore.remove(collection_name, {}, "just_one" && false)
			)
		);
		await app.stop();
	});
});
