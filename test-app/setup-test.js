const app = require("./src/backend/app.js");
const Promise = require("bluebird");

const axios = require("axios");
const axiosCookieJarSupport = require("@3846masa/axios-cookiejar-support");
const tough = require("tough-cookie");
axiosCookieJarSupport(axios);

const App = app._app;

const createCookieJar = () => ({
	jar: new tough.CookieJar(),
	withCredentials: true,
});

global.TEST_CONFIG = {
	USERS: {
		ADMIN: {
			CREDENTIALS: {
				username: "admin",
				password: "admin_password",
			},
			ROLE: "admin",
			SESSION: createCookieJar(),
		},
		REGULAR: {
			CREDENTIALS: {
				username: "regular",
				password: "regular_password",
			},
			ROLE: "regular",
			SESSION: createCookieJar(),
		},
	},
};

const login = (CREDENTIALS, SESSION) =>
	axios.post(`${TEST_CONFIG.API_URL}/sessions`, CREDENTIALS, SESSION);

before(() => {
	App.ConfigManager.set_config("datastore_mongo.db_name", "sealious_test");
	const serverConfig = App.ConfigManager.get_configuration("www-server");
	TEST_CONFIG.API_URL =
		"http://localhost:" + serverConfig.port + serverConfig["api-base"];
	return app.start().then(() =>
		Promise.all(
			Object.keys(TEST_CONFIG.USERS).map(key =>
				App.run_action(
					new App.Sealious.SuperContext(),
					["collections", "users"],
					"create",
					{
						username: TEST_CONFIG.USERS[key].CREDENTIALS.username,
						password: TEST_CONFIG.USERS[key].CREDENTIALS.password,
						role: TEST_CONFIG.USERS[key].ROLE,
					}
				).then(user => {
					TEST_CONFIG.USERS[key].ID = user.id;
					return login(
						TEST_CONFIG.USERS[key].CREDENTIALS,
						TEST_CONFIG.USERS[key].SESSION
					);
				})
			)
		)
	);
});

after(() =>
	Promise.all(
		App.ChipManager.get_all_collections().map(collection_name =>
			App.Datastore.remove(collection_name, {}, "just_one" && false)
		)
	).then(() => console.log("### Cleared test database"))
);
