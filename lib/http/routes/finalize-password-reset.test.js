const locreq = require("locreq")(__dirname);
const assert = require("assert");
const axios = require("axios");
const axiosCookieJarSupport = require("@3846masa/axios-cookiejar-support");
const tough = require("tough-cookie");
const { promise_timeout, assert_throws_async } = locreq("test_utils");
axiosCookieJarSupport(axios);

describe("finalize password reset", () => {
	let app = null;
	const port = 8888;
	const base_url = `http://localhost:${port}`;
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

	it("allows to change a password (entire flow)", async () => {
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
		await axios.post(`${base_url}/api/v1/collections/password-reset-intents`, {
			email: "user@example.com",
		});

		const message = (await axios.get(`${smtp_api}/messages/1.html`)).data;
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

		assert_throws_async(async () => {
			await axios.post(`${base_url}/finalize-password-reset`, {
				email: "user@example.com",
				token,
				password: "using the same token twice hehehehhee",
			});
		});
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
