const locreq = require("locreq")(__dirname);
const axios = require("axios");
const tough = require("tough-cookie");

module.exports = {
	with_stopped_app: with_test_app.bind(global, "auto_start" && false, "dev"),
	with_running_app: with_test_app.bind(global, "auto_start" && true, "dev"),
	with_running_app_prod: with_test_app.bind(
		global,
		"auto_start" && true,
		"production"
	),
	with_stopped_app_prod: with_test_app.bind(
		global,
		"auto_start" && false,
		"production"
	),
};

async function with_test_app(auto_start, env, fn) {
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
			core: { environment: env },
			app: { version: "0.0.0-test" },
			logger: { level: "emerg" },
			"www-server": {
				port,
			},
			password_hash: {
				iterations: 1,
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

	const possible_actions = ["create", "show", "edit", "delete"];

	app.addHook({ when: "after", action: possible_actions }, () =>
		app.Logger.debug(arguments)
	);

	app.addHook({ when: "before", action: possible_actions }, () =>
		app.Logger.debug(arguments)
	);

	let clear_database_on_stop = true;

	app.addHook({ when: "before", action: "stop" }, async () => {
		if (clear_database_on_stop) {
			await Promise.all(
				app.ChipManager.get_all_collections().map(collection_name =>
					app.Datastore.remove(
						collection_name,
						{},
						"just_one" && false
					)
				)
			);
			await app.Datastore.remove(
				app.Metadata.db_collection_name,
				{},
				"just_one" && false
			);
		}
	});

	if (auto_start) {
		await app.start();
	}

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
					(await axios.get(`${smtp_api_url}/messages/${id}.html`))
						.data,
			},
			dont_clear_database_on_stop: () => (clear_database_on_stop = false),
			rest_api: {
				get: async (url, options) =>
					(await axios.get(`${base_url}${url}`, options)).data,
				getSealiousResponse: async (url, options) => {
					const resp = (await axios.get(`${base_url}${url}`, options))
						.data;
					return resp.items
						? new app.Sealious.Responses.CollectionResponse(resp)
						: new app.Sealious.Responses.SingleItemResponse(resp);
				},
				delete: async (url, options) =>
					(await axios.delete(`${base_url}${url}`, options)).data,
				patch: async (url, data, options) =>
					(await axios.patch(`${base_url}${url}`, data, options))
						.data,
				post: async (url, data, options) =>
					(await axios.post(`${base_url}${url}`, data, options)).data,
				login: async ({ username, password }) => {
					const cookie_jar = new tough.CookieJar();
					const options = {
						jar: cookie_jar,
						withCredentials: true,
					};
					await axios.post(
						`${base_url}/api/v1/sessions`,
						{
							username,
							password,
						},
						options
					);
					return options;
				},
			},
		});
	} catch (e) {
		throw e;
	} finally {
		if (app.status !== "stopped") {
			await app.stop();
		}
	}
}
