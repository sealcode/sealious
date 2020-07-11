import assert from "assert";
import { withStoppedApp, MockRestApi } from "../../../test_utils/with-test-app";
import {
	App,
	Collection,
	FieldTypes,
	FieldDefinitionHelper as field,
} from "../../../main";
import { CollectionResponse } from "../../../../common_lib/response/responses";

describe("reverse-single-reference", () => {
	async function createReferencingCollections(
		app: App,
		with_reverse: boolean
	) {
		const A = Collection.fromDefinition(app, {
			name: "A",
			fields: [
				field("reference_to_b", FieldTypes.SingleReference, {
					target_collection: () => app.collections.B,
				}),
				field("pairity", FieldTypes.Text),
			],
		});
		app.registerCollection(A);

		const B = Collection.fromDefinition(app, {
			name: "B",
			fields: [field("number", FieldTypes.Int)],
		});

		if (with_reverse) {
			B.addField(
				field("references_in_a", FieldTypes.ReverseSingleReference, {
					referencing_field: () => A.fields.reference_to_b,
				})
			);
		}
	}

	async function createResources(app: App) {
		const numbers = [1, 2, 3];
		const bs = [];
		for (let number of numbers) {
			bs.push(
				await app.runAction(
					new app.SuperContext(),
					["collections", "B"],
					"create",
					{ number }
				)
			);
		}
		for (let b of bs) {
			for (let i = 1; i <= b.number; i++) {
				await app.runAction(
					new app.SuperContext(),
					["collections", "A"],
					"create",
					{ reference_to_b: b.id, pairity: i % 2 ? "odd" : "even" }
				);
			}
		}
	}

	async function withReverse(
		fn: (args: { app: App; rest_api: MockRestApi }) => Promise<void>
	) {
		return withStoppedApp(async (args) => {
			await createReferencingCollections(
				args.app,
				"with_reverse" && true
			);
			await args.app.start();
			await createResources(args.app);
			await fn(args);
		});
	}

	it("recreates the cached values if the field has just been added", async () => {
		await withStoppedApp(async ({ app, dontClearDatabaseOnStop }) => {
			await createReferencingCollections(app, "with_reverse" && false); // run the app without the reverse field
			await app.start();
			await createResources(app);
			dontClearDatabaseOnStop();
		});
		await withStoppedApp(async ({ app, rest_api }) => {
			await createReferencingCollections(app, "with_reverse" && true);
			await app.start();
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
		await withStoppedApp(async ({ app, rest_api }) => {
			await createReferencingCollections(app, "with_reverse" && true);
			await app.start();
			await createResources(app);
			const {
				items: [result],
			} = await rest_api.get("/api/v1/collections/B?filter[number]=2");
			assert(result.references_in_a instanceof Array);
			assert.equal(result.references_in_a.length, 2);
		});
	});

	it("updates the cached value when an old reference is deleted", async () =>
		withReverse(async ({ rest_api }) => {
			const {
				items: [result],
			} = await rest_api.get("/api/v1/collections/B?filter[number]=2");
			const referencing_id = result.references_in_a[0];
			await rest_api.delete(`/api/v1/collections/A/${referencing_id}`);
			const {
				items: [new_result2],
			} = await rest_api.get("/api/v1/collections/B?filter[number]=2");
			assert.equal(new_result2.references_in_a.length, 1);
		}));

	it("updates the cached value when an old reference is edited to a new one", async () =>
		withReverse(async ({ rest_api }) => {
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
		withReverse(async ({ rest_api }) => {
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
		withReverse(async ({ rest_api }) => {
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
		withReverse(async ({ rest_api }) => {
			const response = (await rest_api.getSealiousResponse(
				"/api/v1/collections/B?attachments[references_in_a]=true"
			)) as CollectionResponse;

			const { pairity } = (response.items[0].references_in_a as {
				pairity: string;
			}[])[0];
			assert.equal(pairity, "odd");
		}));
});
