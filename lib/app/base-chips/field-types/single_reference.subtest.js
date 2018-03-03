const assert = require("assert");
const locreq = require("locreq")(__dirname);
const axios = require("axios");
const { create_resource_as } = locreq("test_utils");

describe("single_reference", () => {
	let App = null;
	const port = 8888;
	const base_url = `http://localhost:${port}/api/v1`;
	beforeEach(async () => {
		App = new Sealious.App({
			"www-server": { port: 8888 },
			upload_path: "/dev/null",
			logger: { level: "emerg" },
			datastore_mongo: TestApp.ConfigManager.get("datastore_mongo"),
		});
		App.createChip(Sealious.Collection, {
			name: "A",
			fields: [
				{
					name: "reference_to_b",
					type: "single_reference",
					params: { collection: "B" },
				},
				{
					name: "filtered_reference_to_b",
					type: "single_reference",
					params: { collection: "B", filter: { number: 1 } },
				},
			],
		});
		App.createChip(Sealious.Collection, {
			name: "B",
			fields: [{ name: "number", type: "int" }],
		});
		await App.start();
	});

	it("should not allow a value that is not an existing id", () => {
		return axios
			.post(`${base_url}/collections/A`, {
				reference_to_b: "non-existing-id",
			})
			.then(res => {
				throw "This should not succeed";
			})
			.catch(res =>
				assert.equal(
					res.response.data.data.reference_to_b.message,
					"Nie masz dostępu do danego zasobu z kolekcji B lub on nie istnieje."
				)
			);
	});

	it("should allow a value that exists in B", async () => {
		const b_id = (await axios.post(`${base_url}/collections/B`, { number: 1 }))
			.data.id;
		return axios.post(`${base_url}/collections/A`, { reference_to_b: b_id });
	});

	it("should not allow a value that exists in B but does not meet the filter criteria", async () => {
		const b_id = (await axios.post(`${base_url}/collections/B`, { number: 0 }))
			.data.id;

		return axios
			.post(`${base_url}/collections/A`, {
				filtered_reference_to_b: b_id,
			})
			.then(response => {
				throw "This should fail";
			})
			.catch(error => {
				assert.equal(
					error.response.data.data.filtered_reference_to_b.message,
					"Nie masz dostępu do danego zasobu z kolekcji B lub on nie istnieje."
				);
			});
	});

	it("should allow a value that exists in B but does not meet the filter criteria", async () => {
		const b_id = (await axios.post(`${base_url}/collections/B`, { number: 1 }))
			.data.id;

		return axios.post(`${base_url}/collections/A`, {
			filtered_reference_to_b: b_id,
		});
	});

	afterEach(async () => {
		await App.stop();
	});
});
