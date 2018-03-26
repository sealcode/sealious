const locreq = require("locreq")(__dirname);
const axios = require("axios");

module.exports = async function with_test_app(fn) {
	let app = null;
	const port = 8888;
	const base_url = `http://localhost:${port}`;
	const smtp_api_url = "http://mailcatcher:1080";

	app = new Sealious.App(
		{
			upload_path: "/tmp",
			datastore_mongo: { host: "db", password: "sealious-test" },
			smtp: {
				host: "mailcatcher",
				port: 1025,
				user: "any",
				password: "any",
			},
			email: {
				from_name: "Sealious test app",
				from_address: "sealious@example.com",
			},
			core: { environment: "production" },
			app: { version: "0.0.0-test" },
			logger: { level: "emerg" },
			"www-server": {
				port,
			},
		},
		{
			name: "testing app",
			logo: locreq.resolve("lib/assets/logo.png"),
			default_language: "pl",
			version: "0.0.0-test",
			base_url,
			colors: {
				primary: "#4d394b",
			},
			admin_email: "admin@example.com",
		}
	);

	app.on("stop", async () =>
		Promise.all(
			app.ChipManager.get_all_collections().map(collection_name =>
				app.Datastore.remove(collection_name, {}, "just_one" && false)
			)
		)
	);

	await app.start();

	try {
		await axios.delete(`${smtp_api_url}/messages`);

		await fn({
			app,
			base_url,
			smtp_api_url,
			mail_api: {
				get_messages: async () =>
					(await axios.get(`${smtp_api_url}/messages`)).data,
				get_message_by_id: async id =>
					(await axios.get(`${smtp_api_url}/messages/${id}.html`)).data,
			},
		});

		return await app.stop();
	} catch (e) {
		await app.stop();
		throw e;
	}
};
