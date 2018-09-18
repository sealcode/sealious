const locreq = require("locreq")(__dirname);
const axios = require("axios");
const assert = require("assert");
const { assert_throws_async } = locreq("test_utils");
const { with_running_app, with_stopped_app } = locreq(
	"test_utils/with-test-app.js"
);

describe("registration-intents", () => {
	async function create_a_user(app) {
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
	}

	it("doesn't allow setting a role for registration intention when the user in context can't create user-roles", async () =>
		with_running_app(async ({ app, base_url }) => {
			app.ChipManager.get_chip(
				"collection",
				"user-roles"
			).set_access_strategy({
				create: "noone",
			});
			await assert_throws_async(
				() =>
					axios.post(
						`${base_url}/api/v1/collections/registration-intents`,
						{
							email: "cunning@fox.com",
							role: "admin",
						}
					),
				e => {
					assert.equal(
						e.response.data.message,
						"You can't perform this action beacuse you can't create user-roles"
					);
				}
			);
		}));

	it("allows setting a role for registration intention when the user in context can create user-roles", async () =>
		with_stopped_app(
			async ({ app, base_url, dont_clear_database_on_stop }) => {
				app.ConfigManager.set("roles", ["admin"]);
				await app.start();
				app.ChipManager.get_chip(
					"collection",
					"user-roles"
				).set_access_strategy({
					create: "public",
				});
				const intent = (await axios.post(
					`${base_url}/api/v1/collections/registration-intents`,
					{
						email: "genuine@fox.com",
						role: "admin",
					}
				)).data;
				assert.equal(intent.role, "admin");
				const response = await app.run_action(
					new app.Sealious.SuperContext(),
					["collections", "registration-intents", intent.id],
					"show"
				);
				assert.equal(response.role, "admin");
			}
		));
});
