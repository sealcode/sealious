const assert = require("assert");
const locreq = require("locreq")(__dirname);
const axios = require("axios");
const { create_resource_as } = locreq("test_utils");
const { with_running_app } = locreq("test_utils/with-test-app.js");
const assert_throws_async = locreq("test_utils/assert_throws_async.js");
const A = "/api/v1/collections/A";
const B = "/api/v1/collections/B";
const C = "/api/v1/collections/C";

const Seals = "/api/v1/collections/seals";
const Water_Areas = "/api/v1/collections/water_areas";
const Water_Area_Types = "/api/v1/collections/water_area_types";

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

			const { items } = await rest_api.get(
				`${A}?filter[reference_to_b][number]=3&format[reference_to_b]=expand`
			);
			assert.deepEqual(items.length, 1);
			assert.deepEqual(items[0].body.reference_to_b.body.number, 3);
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

			const { items } = await rest_api
				.get(
					`${A}?filter[reference_to_b][reference_to_c][number]=3&format[reference_to_b]=deep-expand:2`
				)
				.catch(console.error);

			assert.deepEqual(items.length, 1);
			assert.deepEqual(
				items[0].body.reference_to_b.body.reference_to_c.body.number,
				3
			);
		}));
});

describe("single_reference attachments", () => {
	const items = {};

	async function setup(app, rest_api) {
		app.createChip(app.Sealious.Collection, {
			name: "seals",
			fields: [
				{
					name: "name",
					type: "text",
					required: true,
				},
				{
					name: "water_area",
					type: "single_reference",
					params: { collection: "water_areas" },
				},
			],
		});

		app.createChip(app.Sealious.Collection, {
			name: "water_areas",
			fields: [
				{
					name: "name",
					type: "text",
					required: true,
				},
				{
					name: "type",
					type: "single_reference",
					params: { collection: "water_area_types" },
				},
			],
		});

		app.createChip(app.Sealious.Collection, {
			name: "water_area_types",
			fields: [
				{
					name: "type_name",
					type: "text",
					required: true,
				},
				{
					name: "how_good_for_seals",
					type: "text",
					required: true,
				},
			],
		});

		items.cool_sea = await rest_api.post(Water_Area_Types, {
			type_name: "Cool Sea",
			how_good_for_seals: "perfect",
		});

		items.warm_sea = await rest_api.post(Water_Area_Types, {
			type_name: "Warm Sea",
			how_good_for_seals: "okay",
		});

		items.baltic_sea = await rest_api.post(Water_Areas, {
			name: "Baltic Sea",
			type: items.cool_sea.id,
		});

		items.arabic_sea = await rest_api.post(Water_Areas, {
			name: "Arabic Sea",
			type: items.warm_sea.id,
		});

		items.hoover = await rest_api.post(Seals, {
			name: "Hoover",
			water_area: items.arabic_sea.id,
		});

		items.nelly = await rest_api.post(Seals, {
			name: "Nelly",
			water_area: items.baltic_sea.id,
		});

		items.maksiu = await rest_api.post(Seals, {
			name: "Maksiu",
			water_area: items.baltic_sea.id,
		});
	}

	it("should work", async () =>
		with_running_app(async ({ app, rest_api }) => {
			await setup(app, rest_api);

			const { items: seals } = await rest_api.get(
				`${Seals}?format[water_area]=expand`
			);

			//TODO: will be implemented in next phase
		}));
});
