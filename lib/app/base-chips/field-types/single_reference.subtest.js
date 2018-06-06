const assert = require("assert");
const locreq = require("locreq")(__dirname);
const axios = require("axios");
const { create_resource_as } = locreq("test_utils");
const { with_running_app } = locreq("test_utils/with-test-app.js");
const assert_throws_async = locreq("test_utils/assert_throws_async.js");
const A = "/api/v1/collections/A";
const B = "/api/v1/collections/B";
const C = "/api/v1/collections/C";

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
		with_running_app(async ({ app, base_url, rest_api }) => {
			await create_referencing_collections(app);
			await assert_throws_async(
				() =>
					rest_api.post(A, {
						reference_to_b: "non-existing-id",
					}),
				e =>
					assert.equal(
						e.response.data.data.reference_to_b.message,
						"Nie masz dostępu do danego zasobu z kolekcji B lub on nie istnieje."
					)
			);
		}));

	it("should allow a value that exists in B", async () =>
		with_running_app(async ({ app, base_url, rest_api }) => {
			await create_referencing_collections(app);
			const { id } = await rest_api.post(B, { number: 1 });
			await rest_api.post(A, {
				reference_to_b: id,
			});
		}));

	it("should not allow a value that exists in B but does not meet the filter criteria", async () =>
		with_running_app(async ({ app, base_url, rest_api }) => {
			await create_referencing_collections(app);
			const { id } = await rest_api.post(B, { number: 0 });
			await assert_throws_async(
				() =>
					rest_api.post(A, {
						filtered_reference_to_b: id,
					}),
				e =>
					assert.equal(
						e.response.data.data.filtered_reference_to_b.message,
						"Nie masz dostępu do danego zasobu z kolekcji B lub on nie istnieje."
					)
			);
		}));

	it("should allow a value that exists in B but does not meet the filter criteria", async () =>
		with_running_app(async ({ app, base_url, rest_api }) => {
			await create_referencing_collections(app);
			const { id } = await rest_api.post(B, { number: 1 });
			await rest_api.post(A, { filtered_reference_to_b: id });
		}));

	it("should be filterable by referenced collection fields", async () =>
		with_running_app(async ({ app, base_url, rest_api }) => {
			await create_referencing_collections(app);

			for (let number of [1, 2, 3]) {
				const { id } = await rest_api.post(B, { number });
				await rest_api.post(A, { reference_to_b: id });
			}

			const response = await rest_api.get(
				`${A}?filter[reference_to_b][number]=3&format[reference_to_b]=expand`
			);
			assert.deepEqual(response.length, 1);
			assert.deepEqual(response[0].body.reference_to_b.body.number, 3);
		}));

	it("should be filterable by referenced collection field of referenced collection field", async () =>
		with_running_app(async ({ app, base_url, rest_api }) => {
			// A => B => C
			await app.createChip(app.Sealious.Collection, {
				name: "A",
				fields: [
					{
						name: "reference_to_b",
						type: "single_reference",
						params: { collection: "B" },
					},
				],
			});
			await app.createChip(app.Sealious.Collection, {
				name: "B",
				fields: [
					{
						name: "reference_to_c",
						type: "single_reference",
						params: { collection: "C" },
					},
				],
			});

			await app.createChip(app.Sealious.Collection, {
				name: "C",
				fields: [
					{
						name: "number",
						type: "int",
					},
				],
			});
			let c_ids = [];
			let b_ids = [];
			for (let number of [1, 2, 3]) {
				const { id } = await rest_api.post(C, { number });
				c_ids.push(id);
			}
			for (let c_id of c_ids) {
				const { id } = await rest_api.post(B, {
					reference_to_c: c_id,
				});
				b_ids.push(id);
			}
			for (let b_id of b_ids) {
				const a = await rest_api.post(A, { reference_to_b: b_id });
			}

			const result = await rest_api
				.get(
					`${A}?filter[reference_to_b][reference_to_c][number]=3&format[reference_to_b]=deep-expand:2`
				)
				.catch(console.error);

			assert.deepEqual(result.length, 1);
			assert.deepEqual(
				result[0].body.reference_to_b.body.reference_to_c.body.number,
				3
			);
		}));
});
