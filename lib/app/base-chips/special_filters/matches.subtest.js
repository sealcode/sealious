const assert = require("assert");
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");

const { create_resource_as } = locreq("test_utils");
const { with_running_app } = locreq("test_utils/with-test-app.js");

describe("Matches", () => {
	async function setup(app) {
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
		await Promise.map(numbers, n =>
			create_resource_as({
				collection: "numbers",
				resource: { number: n },
				port,
			})
		);
	}

	it("returns only positive numbers when using filter", () =>
		with_running_app(async ({ app, rest_api }) => {
			await setup(app);
			const result = await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "numbers", "@positive"],
				"show"
			);
			assert.deepEqual(result.map(resource => resource.body.number), [
				1,
				2,
			]);
		}));

	it("returns only positive numbers when using @positive filter", () =>
		with_running_app(async ({ app, rest_api }) => {
			await setup(app);
			const result = await rest_api.get(
				"/api/v1/collections/numbers/@positive?sort[body.number]=asc"
			);

			assert.deepEqual(result.map(resource => resource.body.number), [
				1,
				2,
			]);
		}));

	it("returns empty array when using both @positive and @negative filters", () =>
		with_running_app(async ({ app, rest_api }) => {
			await setup(app);
			const result = await rest_api.get(
				"/api/v1/collections/numbers/@positive/@negative"
			);
			assert.deepEqual(result.map(resource => resource.body.number), []);
		}));
});
