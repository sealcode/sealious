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
const Food = "/api/v1/collections/food";

describe("single_reference", () => {
	describe("from A to B", () => {
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
							e.response.data.data.filtered_reference_to_b
								.message,
							"Nie masz dostępu do danego zasobu z kolekcji B lub on nie istnieje."
						)
				);
			}));

		it("should allow a value that exists in B and meets the filter criteria", async () =>
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

				const response = await rest_api.getSealiousResponse(
					`${A}?filter[reference_to_b][number]=3&attachments[reference_to_b]=true`
				);

				assert.equal(response.items.length, 1);
				assert.equal(response.items[0].reference_to_b.number, 3);
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

				const response = await rest_api
					.getSealiousResponse(
						`${A}?filter[reference_to_b][reference_to_c][number]=3&attachments[reference_to_b][reference_to_c]=true`
					)
					.catch(console.error);

				assert.equal(response.items.length, 1);
				assert.equal(
					response.items[0].reference_to_b.reference_to_c.number,
					3
				);
			}));
	});

	describe("from A to A", () => {
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
						name: "best_friend",
						type: "single_reference",
						params: { collection: "seals" },
					},
				],
			});

			items.hoover = await rest_api.post(Seals, {
				name: "Hoover",
			});

			items.nelly = await rest_api.post(Seals, {
				name: "Nelly",
				best_friend: items.hoover.id,
			});

			items.maksiu = await rest_api.post(Seals, {
				name: "Maksiu",
				best_friend: items.nelly.id,
			});

			items.cycle = await rest_api.post(Seals, {
				name: "Cycle",
			});

			await rest_api.patch(`${Seals}/${items.hoover.id}`, {
				best_friend: items.maksiu.id,
			});
			await rest_api.patch(`${Seals}/${items.cycle.id}`, {
				best_friend: items.cycle.id,
			});
		}

		it("returns single attachment from directly referenced collection", async () =>
			with_running_app(async ({ app, rest_api }) => {
				await setup(app, rest_api);

				const {
					items: [hoover, nelly, maksiu, cycle],
				} = await rest_api.getSealiousResponse(
					`${Seals}?attachments[best_friend]=true`
				);

				assert.equal(hoover.name, "Hoover");
				assert.equal(hoover.best_friend.name, "Maksiu");
				assert.equal(nelly.name, "Nelly");
				assert.equal(nelly.best_friend.name, "Hoover");
				assert.equal(maksiu.name, "Maksiu");
				assert.equal(maksiu.best_friend.name, "Nelly");
				assert.equal(cycle.name, "Cycle");
				assert.equal(cycle.best_friend.name, "Cycle");
			}));
	});

	describe("attachments behaviour", () => {
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
					{
						name: "favourite_meal",
						type: "single_reference",
						params: { collection: "food" },
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

			app.createChip(app.Sealious.Collection, {
				name: "food",
				fields: [
					{
						name: "food_name",
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

			items.warm_sea = await rest_api.post(Water_Area_Types, {
				type_name: "Fantasy Sea",
				how_good_for_seals: "hard_to_tell",
			});

			items.tuna = await rest_api.post(Food, {
				food_name: "Tuna",
			});

			items.baltic_cod = await rest_api.post(Food, {
				food_name: "Baltic Cod",
			});

			items.baltic_sea = await rest_api.post(Water_Areas, {
				name: "Baltic Sea",
				type: items.cool_sea.id,
			});

			items.arabic_sea = await rest_api.post(Water_Areas, {
				name: "Arabic Sea",
				type: items.warm_sea.id,
			});

			items.unused_sea = await rest_api.post(Water_Areas, {
				name: "Unused Sea",
				type: items.warm_sea.id,
			});

			items.hoover = await rest_api.post(Seals, {
				name: "Hoover",
				water_area: items.arabic_sea.id,
				favourite_meal: items.tuna.id,
			});

			items.nelly = await rest_api.post(Seals, {
				name: "Nelly",
				water_area: items.baltic_sea.id,
				favourite_meal: items.tuna.id,
			});

			items.maksiu = await rest_api.post(Seals, {
				name: "Maksiu",
				water_area: items.baltic_sea.id,
				favourite_meal: items.baltic_cod.id,
			});
		}

		it("returns single attachment from directly referenced collection", async () =>
			with_running_app(async ({ app, rest_api }) => {
				await setup(app, rest_api);

				const {
					items: seals,
					attachments,
					fieldsWithAttachments,
				} = await rest_api.get(`${Seals}?attachments[water_area]=true`);

				assert.equal(seals.length, 3);

				assert.deepEqual(fieldsWithAttachments, {
					water_area: {},
				});
				assert.deepEqual(attachments, {
					[items.baltic_sea.id]: items.baltic_sea,
					[items.arabic_sea.id]: items.arabic_sea,
				});
			}));

		it("returns attachments when single resource is queried", async () =>
			with_running_app(async ({ app, rest_api }) => {
				await setup(app, rest_api);

				const {
					item: seal,
					attachments,
					fieldsWithAttachments,
				} = await rest_api.get(
					`${Seals}/${items.maksiu.id}?attachments[water_area]=true`
				);

				assert.equal(seal.name, items.maksiu.name);
				assert.deepEqual(fieldsWithAttachments, {
					water_area: {},
				});
				assert.deepEqual(attachments, {
					[items.baltic_sea.id]: items.baltic_sea,
				});
			}));

		it("throws error when not existing field is given to request", async () =>
			with_running_app(async ({ app, rest_api }) => {
				await setup(app, rest_api);

				const scenarios = {
					"[fake_field_1]": "fake_field_1",
					"[fake_field_1][fake_field_2]": "fake_field_1",
					"[water_area][fake_field_2]": "fake_field_2",
				};

				for (let field_prop of Object.keys(scenarios)) {
					await assert_throws_async(
						() =>
							rest_api.get(
								`${Seals}?attachments${field_prop}=true`
							),
						e => {
							assert.equal(e.response.status, 404);
							assert.equal(
								e.response.data.message,
								`Given field ${
									scenarios[field_prop]
								} is not declared in collection!`
							);
						}
					);
				}
			}));

		it("throws error when inappropriate field is given to request", async () =>
			with_running_app(async ({ app, rest_api }) => {
				await setup(app, rest_api);

				await assert_throws_async(
					() => rest_api.get(`${Seals}?attachments[name]=true`),
					e => {
						assert.equal(e.response.status, 405);
						assert.equal(
							e.response.data.message,
							"Given field name does not support attachments!"
						);
					}
				);
			}));

		it("returns multiple attachments", async () =>
			with_running_app(async ({ app, rest_api }) => {
				await setup(app, rest_api);

				const {
					items: seals,
					attachments,
					fieldsWithAttachments,
				} = await rest_api.get(
					`${Seals}?attachments[water_area][type]=true&attachments[favourite_meal]=true`
				);

				assert.equal(seals.length, 3);

				assert.deepEqual(fieldsWithAttachments, {
					water_area: {
						type: {},
					},
					favourite_meal: {},
				});
				assert.deepEqual(attachments, {
					[items.cool_sea.id]: items.cool_sea,
					[items.warm_sea.id]: items.warm_sea,
					[items.baltic_sea.id]: items.baltic_sea,
					[items.arabic_sea.id]: items.arabic_sea,
					[items.tuna.id]: items.tuna,
					[items.baltic_cod.id]: items.baltic_cod,
				});
			}));
	});
});
