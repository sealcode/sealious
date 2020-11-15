import assert from "assert";
import { withRunningApp } from "../../../test_utils/with-test-app";
import { App, Collection, FieldTypes, Field } from "../../../main";
import { TestAppType } from "../../../test_utils/test-app";

const extend = (with_reverse: boolean = true, clear_database: boolean = true) =>
	function (t: TestAppType) {
		const b_fields: { [name: string]: Field } = {
			number: new FieldTypes.Int(),
		};
		if (with_reverse) {
			b_fields.references_in_a = new FieldTypes.ReverseSingleReference({
				referencing_collection: "A",
				referencing_field: "reference_to_b",
			});
		}

		return class extends t {
			clear_database_on_stop = clear_database;
			collections = {
				...t.BaseCollections,
				A: new (class extends Collection {
					fields = {
						reference_to_b: new FieldTypes.SingleReference("B"),
						pairity: new FieldTypes.Text(),
					};
				})(),
				B: new (class extends Collection {
					fields = b_fields;
				})(),
			};
		};
	};

describe("reverse-single-reference", () => {
	async function createResources(app: App) {
		const numbers = [1, 2, 3];
		const bs = [];
		for (let number of numbers) {
			bs.push(
				await app.collections.B.suCreate({
					number,
				})
			);
		}
		for (let b of bs) {
			for (let i = 1; i <= b.get("number"); i++) {
				await app.collections.A.suCreate({
					reference_to_b: b.id,
					pairity: i % 2 ? "odd" : "even",
				});
			}
		}
	}

	it("recreates the cached values if the field has just been added", async () => {
		await withRunningApp(extend(false, false), async ({ app }) => {
			await createResources(app);
		});
		await withRunningApp(extend(true), async ({ rest_api }) => {
			const {
				items: [result],
			} = await rest_api.get("/api/v1/collections/B?filter[number]=1");
			assert(result.references_in_a);
			assert.equal(result.references_in_a.length, 1);
			const {
				items: [result2],
			} = await rest_api.get("/api/v1/collections/B?filter[number]=2");
			assert(result2.references_in_a);
			assert.equal(result2.references_in_a.length, 2);
		});
	});

	it("updates the cached value when a new reference is created", async () => {
		await withRunningApp(extend(true), async ({ app, rest_api }) => {
			await createResources(app);
			const {
				items: [result],
			} = await rest_api.get("/api/v1/collections/B?filter[number]=2");
			assert(result.references_in_a instanceof Array);
			assert.equal(result.references_in_a.length, 2);
		});
	});

	it("updates the cached value when an old reference is deleted", async () =>
		withRunningApp(extend(true), async ({ app, rest_api }) => {
			await createResources(app);
			const { items } = await rest_api.get(
				"/api/v1/collections/B?filter[number]=2"
			);
			const referencing_id = items[0].references_in_a[0];
			await rest_api.delete(`/api/v1/collections/A/${referencing_id}`);
			const {
				items: [new_result2],
			} = await rest_api.get("/api/v1/collections/B?filter[number]=2");
			assert.equal(new_result2.references_in_a.length, 1);
		}));

	it("updates the cached value when an old reference is edited to a new one", async () =>
		withRunningApp(extend(true), async ({ rest_api, app }) => {
			await createResources(app);
			const {
				items: [result1],
			} = await rest_api.get("/api/v1/collections/B?filter[number]=1");
			const {
				items: [result2],
			} = await rest_api.get("/api/v1/collections/B?filter[number]=2");
			const referencing_id = result2.references_in_a[0];

			await rest_api.patch(`/api/v1/collections/A/${referencing_id}`, {
				reference_to_b: result1.id,
			});

			const {
				items: [new_result2],
			} = await rest_api.get("/api/v1/collections/B?filter[number]=2");
			assert.equal(new_result2.references_in_a.length, 1);
			const {
				items: [new_result1],
			} = await rest_api.get("/api/v1/collections/B?filter[number]=1");
			assert.equal(new_result1.references_in_a.length, 2);
		}));

	it("updates the cached value when an old reference is edited to an empty one", async () =>
		withRunningApp(extend(true), async ({ rest_api, app }) => {
			await createResources(app);
			await rest_api.get("/api/v1/collections/B?filter[number]=1");
			const {
				items: [result2],
			} = await rest_api.get("/api/v1/collections/B?filter[number]=2");
			const referencing_id = result2.references_in_a[0];

			await rest_api.patch(`/api/v1/collections/A/${referencing_id}`, {
				reference_to_b: "",
			});
			const {
				items: [new_result2],
			} = await rest_api.get("/api/v1/collections/B?filter[number]=2");
			assert.equal(new_result2.references_in_a.length, 1);
		}));

	it("allows to filter by a value of the referencing resource", async () =>
		withRunningApp(extend(true), async ({ rest_api, app }) => {
			await createResources(app);
			let results = (
				await rest_api.get(
					"/api/v1/collections/B?filter[references_in_a][pairity]=non-existant"
				)
			).items;
			assert.equal(results.length, 0);
			results = (
				await rest_api.get(
					"/api/v1/collections/B?filter[references_in_a][pairity]=odd"
				)
			).items;
			assert.equal(results.length, 3);
			results = (
				await rest_api.get(
					"/api/v1/collections/B?filter[references_in_a][pairity]=even&filter[number]=3"
				)
			).items;
			assert.equal(results.length, 1);
		}));

	it("allows to display the full body of the referencing resources", async () =>
		withRunningApp(extend(true), async ({ rest_api, app }) => {
			await createResources(app);
			const { items, attachments } = await rest_api.get(
				"/api/v1/collections/B?attachments[references_in_a]=true"
			);

			const referenced_id = items[0].references_in_a[0];
			assert.equal(attachments[referenced_id].pairity, "odd");
		}));
});
