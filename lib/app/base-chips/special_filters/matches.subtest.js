const assert = require("assert");
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");

const { with_running_app } = locreq("test_utils/with-test-app.js");

describe("Matches", () => {
	async function setup(app, rest_api) {
		const port = app.ConfigManager.get("www-server.port");
		app.createChip(Sealious.Collection, {
			name: "numbers",
			fields: [
				{
					name: "number",
					type: "int",
				},
			],
			named_filters: {
				positive: app.SpecialFilter.Matches({ number: { ">": 0 } }),
				negative: app.SpecialFilter.Matches({ number: { "<": 0 } }),
			},
		});

		const numbers = [-2, -1, 0, 1, 2];
		for (let number of numbers) {
			await rest_api.post("/api/v1/collections/numbers", { number });
		}
	}

	it("returns only positive numbers when using filter", () =>
		with_running_app(async ({ app, rest_api }) => {
			await setup(app, rest_api);
			const sealious_response = await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "numbers", "@positive"],
				"show"
			);
			assert.deepEqual(
				sealious_response.items.map(resource => resource.number),
				[1, 2]
			);
		}));

	it("returns only positive numbers when using @positive filter", () =>
		with_running_app(async ({ app, rest_api }) => {
			await setup(app, rest_api);
			const { items } = await rest_api.get(
				"/api/v1/collections/numbers/@positive?sort[number]=asc"
			);

			assert.deepEqual(items.map(resource => resource.number), [1, 2]);
		}));

	it("returns empty array when using both @positive and @negative filters", () =>
		with_running_app(async ({ app, rest_api }) => {
			await setup(app, rest_api);
			const { items } = await rest_api.get(
				"/api/v1/collections/numbers/@positive/@negative"
			);
			assert.deepEqual(items.map(resource => resource.number), []);
		}));
});
