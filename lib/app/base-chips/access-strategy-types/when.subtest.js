const locreq = require("locreq")(__dirname);
const assert = require("assert");
const { with_stopped_app } = locreq("test_utils/with-test-app.js");
const assert_throws_async = locreq("test_utils/assert_throws_async.js");
const axios = require("axios");

describe("when", () => {
	async function create_resources(app) {
		app.createChip(app.Sealious.Collection, {
			name: "numbers",
			fields: [{ name: "number", type: "int" }],
			named_filters: {
				positive: app.SpecialFilter.Matches({ number: { ">": 0 } }),
				negative: app.SpecialFilter.Matches({ number: { "<": 0 } }),
			},
			access_strategy: {
				default: ["when", ["numbers", "negative", "logged_in", "public"]],
			},
		});

		await app.start();

		for (let number of [-1, 0, 1]) {
			await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "numbers"],
				"create",
				{ number }
			);
		}

		await app.run_action(
			new app.Sealious.SuperContext(),
			["collections", "users"],
			"create",
			{ username: "user", password: "password", email: "user@example.com" }
		);
	}

	it("should only use 'when_true' access strategy when the item passes the filter", async () =>
		with_stopped_app(async ({ app, base_url, rest_api }) => {
			await create_resources(app);
			const session = await rest_api.login({
				username: "user",
				password: "password",
			});

			const resources_when_logged_in = await rest_api.get(
				"/api/v1/collections/numbers?sort[body.number]=asc",
				session
			);

			assert.equal(resources_when_logged_in.length, 3);
			assert.equal(resources_when_logged_in[0].body.number, -1);
		}));

	it("should only use 'when_false' access strategy when the item doesn't pass the filter", async () =>
		with_stopped_app(async ({ app, base_url, rest_api }) => {
			await create_resources(app);

			const public_resources = await rest_api.get(
				"/api/v1/collections/numbers?sort[body.number]=asc"
			);

			assert.equal(public_resources.length, 2);
		}));
});
