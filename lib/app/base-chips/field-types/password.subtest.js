const assert = require("assert");
const locreq = require("locreq")(__dirname);
const { with_running_app } = locreq("test_utils/with-test-app.js");
const SecureHasher = locreq("lib/utils/secure-hasher.js");

describe("password", () => {
	const password = "it-really-doesnt-matter";
	const username = "some-user";
	let user_id;

	async function setup(app, rest_api, base_url) {
		user_id = (await app.run_action(
			new app.Sealious.SuperContext(),
			["collections", "users"],
			"create",
			{
				username,
				password,
				email: "some-user@example.com",
			}
		)).id;
	}

	it("Hides password", async () =>
		with_running_app(async ({ app, rest_api, base_url }) => {
			await setup(app, rest_api, base_url);
			const session = await rest_api.login({
				username,
				password,
			});

			assert.ok(
				!(await rest_api.get(
					`/api/v1/collections/users/${user_id}`,
					session
				)).body.password
			);

			assert.ok(
				!(await app.run_action(
					new app.Sealious.SuperContext(),
					["collections", "users", user_id],
					"show"
				)).body.password
			);
		}));

	it("Stores correct password value", async () =>
		with_running_app(async ({ app, rest_api, base_url }) => {
			await setup(app, rest_api, base_url);

			const hashed_password = (await app.Datastore.find("users", {
				sealious_id: user_id,
			}))[0].body.password;

			assert.ok(await SecureHasher.matches(password, hashed_password));
			assert.ok(
				!(await SecureHasher.matches("wrong-password", hashed_password))
			);
			assert.ok(!(await SecureHasher.matches("", hashed_password)));
		}));
});
