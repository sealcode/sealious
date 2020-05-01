const assert = require("assert");
const { with_stopped_app } = require("../../../../test_utils/with-test-app.js");

describe("user-referenced-in-field", () => {
	it("should deny if the user isn't the one referenced in the field and allow if it is", async () =>
		with_stopped_app(async ({ app, base_url, rest_api }) => {
			app.createChip(app.Sealious.Collection, {
				name: "pets",
				fields: [
					{ name: "name", type: "text" },
					{
						name: "owner",
						type: "single_reference",
						params: { collection: "users" },
					},
				],
				access_strategy: {
					create: "public",
					default: ["user-referenced-in-field", "owner"],
				},
			});
			await app.start();

			for (let username of ["Alice", "Bob"]) {
				const user = await app.run_action(
					new app.Sealious.SuperContext(),
					["collections", "users"],
					"create",
					{
						username: username,
						password: "password",
						email: `${username.toLowerCase()}@example.com`,
					}
				);
				await app.run_action(
					new app.Sealious.SuperContext(),
					["collections", "pets"],
					"create",
					{ name: `${username}'s pet`, owner: user.id }
				);
			}

			const alice_session = await rest_api.login({
				username: "Alice",
				password: "password",
			});

			const { items } = await rest_api.get(
				"/api/v1/collections/pets",
				alice_session
			);
			assert.equal(items.length, 1);
			assert.equal(items[0].name, "Alice&#39;s pet");
		}));
});
