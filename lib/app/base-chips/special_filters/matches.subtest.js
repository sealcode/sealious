const assert = require("assert");
const locreq = require("locreq")(__dirname);
const axios = require("axios");
const Promise = require("bluebird");

const { create_resource_as } = locreq("test_utils");
const matches = require("./matches");
const with_test_app = locreq("test_utils/with-test-app.js");

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
				positive: matches({ number: { ">": 0 } }),
				negative: matches({ number: { "<": 0 } }),
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

	it("returns only positive numbers when using @positive filter", () =>
		with_test_app(async ({ app, base_url }) => {
			await setup(app);
			return axios
				.get(
					`${base_url}/api/v1/collections/numbers/@positive?sort[body.number]=asc`
				)
				.then(resp =>
					assert.deepEqual(resp.data.map(resource => resource.body.number), [
						1,
						2,
					])
				);
		}));

	it("returns empty array when using both @positive and @negative filters", () =>
		with_test_app(async ({ app, base_url }) => {
			await setup(app);
			return axios
				.get(`${base_url}/api/v1/collections/numbers/@positive/@negative`)
				.then(resp =>
					assert.deepEqual(resp.data.map(resource => resource.body.number), [])
				);
		}));
});
