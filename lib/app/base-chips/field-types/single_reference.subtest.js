const assert = require("assert");
const locreq = require("locreq")(__dirname);
const axios = require("axios");
const { create_resource_as } = locreq("test_utils");
const { with_running_app } = locreq("test_utils/with-test-app.js");

describe("single_reference", () => {
	async function create_referencing_collections(app) {
		app.createChip(app.Sealious.Collection, {
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
		app.createChip(app.Sealious.Collection, {
			name: "B",
			fields: [{ name: "number", type: "int" }],
		});
	}

	it("should not allow a value that is not an existing id", async () =>
		with_running_app(async ({ app, base_url }) => {
			await create_referencing_collections(app);
			return axios
				.post(`${base_url}/api/v1/collections/A`, {
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
		}));

	it("should allow a value that exists in B", async () =>
		with_running_app(async ({ app, base_url }) => {
			create_referencing_collections(app);
			const b_id = (await axios.post(`${base_url}/api/v1/collections/B`, {
				number: 1,
			})).data.id;
			return axios.post(`${base_url}/api/v1/collections/A`, {
				reference_to_b: b_id,
			});
		}));

	it("should not allow a value that exists in B but does not meet the filter criteria", async () =>
		with_running_app(async ({ app, base_url }) => {
			create_referencing_collections(app);
			const b_id = (await axios.post(`${base_url}/api/v1/collections/B`, {
				number: 0,
			})).data.id;

			return axios
				.post(`${base_url}/api/v1/collections/A`, {
					filtered_reference_to_b: b_id,
				})
				.then(response => {
					throw "This should fail";
				})
				.catch(error => {
					assert.equal(
						error.response.data.data.filtered_reference_to_b
							.message,
						"Nie masz dostępu do danego zasobu z kolekcji B lub on nie istnieje."
					);
				});
		}));

	it("should allow a value that exists in B but does not meet the filter criteria", async () =>
		with_running_app(async ({ app, base_url }) => {
			create_referencing_collections(app);
			const b_id = (await axios.post(`${base_url}/api/v1/collections/B`, {
				number: 1,
			})).data.id;

			return axios.post(`${base_url}/api/v1/collections/A`, {
				filtered_reference_to_b: b_id,
			});
		}));
});
