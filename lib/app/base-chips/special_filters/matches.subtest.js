const assert = require("assert");
const locreq = require("locreq")(__dirname);
const axios = require("axios");
const Promise = require("bluebird");

const { create_resource_as } = locreq("test_utils");
const matches = require("./matches");

describe("Matches", () => {
	let App = null;
	const port = 8888;
	const base_url = `http://localhost:${port}/api/v1`;
	beforeEach(async () => {
		App = new Sealious.App(
			{
				"www-server": { port: 8888 },
				upload_path: "/dev/null",
				logger: { level: "emerg" },
				datastore_mongo: TestApp.ConfigManager.get("datastore_mongo"),
			},
			TestApp.manifest
		);

		App.createChip(Sealious.Collection, {
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

		await App.start();

		const numbers = [-2, -1, 0, 1, 2];
		await Promise.map(numbers, n =>
			create_resource_as({
				collection: "numbers",
				resource: { number: n },
				port,
			})
		);
	});

	it("returns only positive numbers when using @positive filter", () =>
		axios
			.get(`${base_url}/collections/numbers/@positive?sort[body.number]=asc`)
			.then(resp =>
				assert.deepEqual(resp.data.map(resource => resource.body.number), [
					1,
					2,
				])
			));

	it("returns empty array when using both @positive and @negative filters", () =>
		axios
			.get(`${base_url}/collections/numbers/@positive/@negative`)
			.then(resp =>
				assert.deepEqual(resp.data.map(resource => resource.body.number), [])
			));

	afterEach(async () => {
		await Promise.all(
			App.ChipManager.get_all_collections().map(collection_name =>
				App.Datastore.remove(collection_name, {}, "just_one" && false)
			)
		);
		await App.stop();
	});
});
