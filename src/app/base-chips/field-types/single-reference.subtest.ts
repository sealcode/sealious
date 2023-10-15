import assert from "assert";
import { TestAppConstructor, withRunningApp } from "../../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async";
import { Collection, FieldTypes } from "../../../main";
import type { SerializedItemBody } from "../../../chip-types/collection-item";
import type MockRestApi from "../../../test_utils/rest-api";
import { TestApp } from "../../../test_utils/test-app";
const A = "/api/v1/collections/A";
const B = "/api/v1/collections/B";
const C = "/api/v1/collections/C";

const Seals = "/api/v1/collections/seals";
const Water_Areas = "/api/v1/collections/water_areas";
const Water_Area_Types = "/api/v1/collections/water_area_types";
const Food = "/api/v1/collections/food";

describe("single_reference", () => {
	describe("from A to B", () => {
		function extend(t: TestAppConstructor) {
			const A = new (class extends Collection {
				name = "A";
				fields = {
					reference_to_b: new FieldTypes.SingleReference("B"),
					filtered_reference_to_b: new FieldTypes.SingleReference("B", { number: 1 }),
				};
			})();
			const B = new (class extends Collection {
				name = "B";
				fields = { number: new FieldTypes.Int() };
			})();

			return class extends t {
				collections = {
					...TestApp.BaseCollections,
					A,
					B,
				};
			};
		}

		it("should not allow a value that is not an existing id", async () =>
			withRunningApp(extend, async ({ app, rest_api }) => {
				await assertThrowsAsync(
					() =>
						rest_api.post(A, {
							reference_to_b: "non-existing-id",
						}),
					(e) =>
						assert.equal(
							e.response.data.data.field_messages.reference_to_b.message,
							app.i18n("invalid_single_reference", ["B"])
						)
				);
			}));

		it("should allow a value that exists in B", async () =>
			withRunningApp(extend, async ({ rest_api }) => {
				const { id } = await rest_api.post(B, { number: 1 });
				await rest_api.post(A, {
					reference_to_b: id,
				});
			}));

		it("should not allow a value that exists in B but does not meet the filter criteria", async () =>
			withRunningApp(extend, async ({ app, rest_api }) => {
				const { id } = await rest_api.post(B, { number: 0 });
				await assertThrowsAsync(
					() =>
						rest_api.post(A, {
							filtered_reference_to_b: id,
						}),
					(e) =>
						assert.equal(
							e.response.data.data.field_messages.filtered_reference_to_b.message,
							app.i18n("invalid_single_reference", ["B"])
						)
				);
			}));

		it("should allow a value that exists in B and meets the filter criteria", async () =>
			withRunningApp(extend, async ({ rest_api }) => {
				const { id } = await rest_api.post(B, { number: 1 });
				await rest_api.post(A, { filtered_reference_to_b: id });
			}));

		it("should be filterable by referenced collection fields", async () =>
			withRunningApp(extend, async ({ app, rest_api }) => {
				for (let number of [1, 2, 3]) {
					const item = await rest_api.post(B, { number });
					await rest_api.post(A, { reference_to_b: item.id });
				}

				const response = await rest_api.get(
					`${A}?filter[reference_to_b][number]=3&attachments[reference_to_b]=true`
				);
				assert.equal(response.items.length, 1);
				assert.equal(response.attachments[response.items[0].reference_to_b].number, 3);
			}));

		it("should be filterable by referenced collection field of referenced collection field", async () =>
			withRunningApp(
				(app_class) => {
					// A => B => C
					const A = new (class extends Collection {
						name = "A";
						fields = {
							reference_to_b: new FieldTypes.SingleReference("B"),
						};
					})();
					const B = new (class extends Collection {
						name = "B";
						fields = {
							reference_to_c: new FieldTypes.SingleReference("C"),
						};
					})();

					const C = new (class extends Collection {
						name = "C";
						fields = { number: new FieldTypes.Int() };
					})();

					return class extends app_class {
						collections = {
							...TestApp.BaseCollections,
							A,
							B,
							C,
						};
					};
				},
				async ({ rest_api }) => {
					let c_ids = [];
					let b_ids = [];
					for (let number of [1, 2, 3]) {
						const { id } = await rest_api.post("/api/v1/collections/C", {
							number,
						});
						c_ids.push(id);
					}
					for (let c_id of c_ids) {
						const { id } = await rest_api.post("/api/v1/collections/B", {
							reference_to_c: c_id,
						});
						b_ids.push(id);
					}
					for (let b_id of b_ids) {
						await rest_api.post("/api/v1/collections/A", {
							reference_to_b: b_id,
						});
					}

					const response = await rest_api.get(
						`/api/v1/collections/A?filter[reference_to_b][reference_to_c][number]=3&attachments[reference_to_b][reference_to_c]=true`
					);

					assert.equal(response.items.length, 1);
					assert.equal(
						response.attachments[
							response.attachments[response.items[0].reference_to_b].reference_to_c
						].number,
						3
					);
				}
			));
	});

	describe("from A to A", () => {
		const items: { [name: string]: SerializedItemBody } = {};

		function extend(t: TestAppConstructor) {
			const seals = new (class extends Collection {
				name = "seals";
				fields = {
					name: new FieldTypes.Text(),
					best_friend: new FieldTypes.SingleReference("seals"),
				};
			})();

			return class extends t {
				collections = { ...TestApp.BaseCollections, seals };
			};
		}

		async function setup(rest_api: MockRestApi) {
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

		it("returns single attachment from a directly referenced collection", async () =>
			withRunningApp(extend, async ({ rest_api }) => {
				await setup(rest_api);

				const {
					items: [hoover, nelly, maksiu, cycle],
					attachments,
				} = await rest_api.get(`${Seals}?attachments[best_friend]=true`);

				assert.equal(hoover.name, "Hoover");
				assert.equal(nelly.name, "Nelly");
				assert.equal(attachments[nelly.best_friend].name, "Hoover");
				assert.equal(maksiu.name, "Maksiu");
				assert.equal(attachments[maksiu.best_friend].name, "Nelly");
				assert.equal(cycle.name, "Cycle");
				assert.equal(attachments[cycle.best_friend].name, "Cycle");
			}));
	});

	describe("attachments behaviour", () => {
		const items: { [name: string]: SerializedItemBody } = {};

		function extend(t: TestAppConstructor) {
			const seals = new (class extends Collection {
				name = "seals";
				fields = {
					name: new FieldTypes.Text(),
					water_area: new FieldTypes.SingleReference("water_areas"),
					favourite_meal: new FieldTypes.SingleReference("food"),
				};
			})();

			const water_areas = new (class extends Collection {
				name = "water_areas";
				fields = {
					name: new FieldTypes.Text(),
					type: new FieldTypes.SingleReference("water_area_types"),
				};
			})();

			const water_area_types = new (class extends Collection {
				name = "water_area_types";
				fields = {
					type_name: new FieldTypes.Text(),
					how_good_for_seals: new FieldTypes.Text(),
				};
			})();

			const food = new (class extends Collection {
				name = "food";
				fields = { food_name: new FieldTypes.Text() };
			})();
			return class extends t {
				collections = {
					...TestApp.BaseCollections,
					seals,
					water_areas,
					water_area_types,
					food,
				};
			};
		}

		async function setup(rest_api: MockRestApi) {
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
			withRunningApp(extend, async ({ rest_api }) => {
				await setup(rest_api);

				const {
					items: seals,
					attachments,
					fields_with_attachments,
				} = await rest_api.get(`${Seals}?attachments[water_area]=true`);

				assert.equal(seals.length, 3);

				assert.deepEqual(fields_with_attachments, ["water_area"]);
				assert.deepEqual(attachments, {
					[items.baltic_sea.id]: items.baltic_sea,
					[items.arabic_sea.id]: items.arabic_sea,
				});
			}));

		it("returns attachments when single resource is queried", async () =>
			withRunningApp(extend, async ({ rest_api }) => {
				await setup(rest_api);

				const {
					items: [seal],
					attachments,
					fields_with_attachments,
				} = await rest_api.get(`${Seals}/${items.maksiu.id}?attachments[water_area]=true`);
				assert.equal(seal.name, items.maksiu.name);
				assert.deepEqual(fields_with_attachments, ["water_area"]);
				assert.deepEqual(attachments, {
					[items.baltic_sea.id]: items.baltic_sea,
				});
			}));

		it("throws an error when not existing field is given to request", async () =>
			withRunningApp(extend, async ({ rest_api }) => {
				await setup(rest_api);

				const scenarios = {
					"[fake_field_1]": "fake_field_1",
					"[fake_field_1][fake_field_2]": "fake_field_1",
					"[water_area][fake_field_2]": "fake_field_2",
				};

				for (let field_prop of Object.keys(scenarios)) {
					await assertThrowsAsync(
						() => rest_api.get(`${Seals}?attachments${field_prop}=true`),
						(e) => {
							assert.equal(e.response.status, 404);
							assert.equal(
								e.response.data.message,
								`Given field ${
									scenarios[field_prop as keyof typeof scenarios]
								} is not declared in collection!`
							);
						}
					);
				}
			}));

		it("throws an error when an inappropriate field is given to request", async () =>
			withRunningApp(extend, async ({ rest_api }) => {
				await setup(rest_api);

				await assertThrowsAsync(
					() => rest_api.get(`${Seals}?attachments[name]=true`),
					(e) => {
						assert.equal(e.response.status, 405);
						assert.equal(
							e.response.data.message,
							"Field 'name' does not support attachments"
						);
					}
				);
			}));

		it("returns multiple attachments", async () =>
			withRunningApp(extend, async ({ rest_api }) => {
				await setup(rest_api);

				const {
					items: seals,
					attachments,
					fields_with_attachments,
				} = await rest_api.get(
					`${Seals}?attachments[water_area][type]=true&attachments[favourite_meal]=true`
				);

				assert.equal(seals.length, 3);

				assert.deepEqual(fields_with_attachments, ["water_area", "favourite_meal"]);
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

	it("allows filtering by just the id of the referenced resource", () =>
		withRunningApp(
			(test_app) => {
				const A = new (class extends Collection {
					name = "A";
					fields = {
						reference_to_b: new FieldTypes.SingleReference("B"),
					};
				})();
				const B = new (class extends Collection {
					name = "B";
					fields = { number: new FieldTypes.Int() };
				})();

				return class extends test_app {
					collections = {
						...TestApp.BaseCollections,
						A,
						B,
					};
				};
			},
			async ({ app }) => {
				const b = await app.collections.B.suCreate({ number: 2 });
				await app.collections.A.suCreate({ reference_to_b: b.id });
				const { items } = await app.collections.A.suList()
					.filter({ reference_to_b: b.id })
					.fetch();
				assert.strictEqual(items.length, 1);
				const { items: items2 } = await app.collections.A.suList()
					.filter({ reference_to_b: b.id + "some random garbage" })
					.fetch();

				assert.strictEqual(items2.length, 0);
			}
		));
});
