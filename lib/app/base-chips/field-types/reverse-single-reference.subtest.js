const assert = require("assert");
const Promise = require("bluebird");
const axios = require("axios");
const { create_resource_as } = require("../../../../test_utils");
const {
	with_stopped_app,
	with_running_app,
} = require("../../../../test_utils/with-test-app.js");
const DatastoreMongoFactory = require("../../../datastore/db.js");

describe("reverse-single-reference", () => {
	async function create_referencing_collections(app, with_reverse) {
		const A = app.createChip(app.Sealious.Collection, {
			name: "A",
			fields: [
				{
					name: "reference_to_b",
					type: "single_reference",
					params: { collection: "B" },
				},
				{
					name: "pairity",
					type: "text",
				},
			],
		});
		const B = app.createChip(app.Sealious.Collection, {
			name: "B",
			fields: [{ name: "number", type: "int" }],
		});
		if (with_reverse) {
			B.add_field({
				name: "references_in_a",
				type: "reverse-single-reference",
				params: { collection: "A", field_name: "reference_to_b" },
			});
		}
	}

	async function create_resources(app) {
		const numbers = [1, 2, 3];
		const bs = [];
		for (let number of numbers) {
			bs.push(
				await app.run_action(
					new app.Sealious.SuperContext(),
					["collections", "B"],
					"create",
					{ number }
				)
			);
		}
		for (let b of bs) {
			for (let i = 1; i <= b.number; i++) {
				await app.run_action(
					new app.Sealious.SuperContext(),
					["collections", "A"],
					"create",
					{ reference_to_b: b.id, pairity: i % 2 ? "odd" : "even" }
				);
			}
		}
	}

	async function with_reverse(fn) {
		return with_stopped_app(async (args) => {
			await create_referencing_collections(
				args.app,
				"with_reverse" && true
			);
			await args.app.start();
			await create_resources(args.app);
			await fn(args);
		});
	}

	it("recreates the cached values if the field has just been added", async () => {
		await with_stopped_app(async ({ app, dont_clear_database_on_stop }) => {
			await create_referencing_collections(app, "with_reverse" && false);
			await app.start();
			await create_resources(app);
			dont_clear_database_on_stop();
		});
		await with_stopped_app(async ({ base_url, app, rest_api }) => {
			await create_referencing_collections(app, "with_reverse" && true);
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
		await with_stopped_app(async ({ app, rest_api }) => {
			await create_referencing_collections(app, "with_reverse" && true);
			await app.start();
			await create_resources(app);
			const {
				items: [result],
			} = await rest_api.get("/api/v1/collections/B?filter[number]=2");
			assert(result.references_in_a instanceof Array);
			assert.equal(result.references_in_a.length, 2);
		});
	});

	it("updates the cached value when an old reference is deleted", async () =>
		with_reverse(async ({ app, rest_api }) => {
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
		with_reverse(async ({ app, rest_api }) => {
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
		with_reverse(async ({ app, rest_api }) => {
			const {
				items: [result1],
			} = await rest_api.get("/api/v1/collections/B?filter[number]=1");
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
		with_reverse(async ({ app, rest_api }) => {
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
		with_reverse(async ({ app, rest_api }) => {
			const response = await rest_api.getSealiousResponse(
				"/api/v1/collections/B?attachments[references_in_a]=true"
			);

			const { pairity } = response.items[0].references_in_a[0];
			assert.equal(pairity, "odd");
		}));
});
