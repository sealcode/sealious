const assert = require("assert");
const Promise = require("bluebird");
const locreq = require("locreq")(__dirname);
const axios = require("axios");
const { create_resource_as } = locreq("test_utils");
const { with_stopped_app, with_running_app } = locreq(
	"test_utils/with-test-app.js"
);
const DatastoreMongoFactory = locreq("lib/datastore/db.js");

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
				params: { collection: A, field_name: "reference_to_b" },
			});
		}
	}

	async function create_resources(app) {
		const numbers = [1, 2, 3];
		const bs = await Promise.map(numbers, number =>
			app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "B"],
				"create",
				{ number }
			)
		);
		for (let b of bs) {
			for (let i = 1; i <= b.body.number; i++) {
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
		return with_stopped_app(async args => {
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
			const result = (await rest_api.get(
				"/api/v1/collections/B?filter[number]=1"
			))[0];
			assert(result.body.references_in_a);
			assert.equal(result.body.references_in_a.length, 1);
			const result2 = (await rest_api.get(
				"/api/v1/collections/B?filter[number]=2"
			))[0];
			assert(result2.body.references_in_a);
			assert.equal(result2.body.references_in_a.length, 2);
		});
	});

	it("updates the cached value when a new reference is created", async () => {
		await with_stopped_app(async ({ app, rest_api }) => {
			await create_referencing_collections(app, "with_reverse" && true);
			await app.start();
			await create_resources(app);
			const result2 = (await rest_api.get(
				"/api/v1/collections/B?filter[number]=2"
			))[0];
			assert(result2.body.references_in_a instanceof Array);
			assert.equal(result2.body.references_in_a.length, 2);
		});
	});

	it("updates the cached value when an old reference is deleted", async () =>
		with_reverse(async ({ app, rest_api }) => {
			const result2 = (await rest_api.get(
				"/api/v1/collections/B?filter[number]=2"
			))[0];
			const referencing_id = result2.body.references_in_a[0];
			await rest_api.delete(`/api/v1/collections/A/${referencing_id}`);
			const new_result2 = (await rest_api.get(
				"/api/v1/collections/B?filter[number]=2"
			))[0];
			assert.equal(new_result2.body.references_in_a.length, 1);
		}));

	it("updates the cached value when an old reference is edited to a new one", async () =>
		with_reverse(async ({ app, rest_api }) => {
			const result1 = (await rest_api.get(
				"/api/v1/collections/B?filter[number]=1"
			))[0];
			const result2 = (await rest_api.get(
				"/api/v1/collections/B?filter[number]=2"
			))[0];
			const referencing_id = result2.body.references_in_a[0];

			await rest_api.patch(`/api/v1/collections/A/${referencing_id}`, {
				reference_to_b: result1.id,
			});
			const new_result2 = (await rest_api.get(
				"/api/v1/collections/B?filter[number]=2"
			))[0];
			assert.equal(new_result2.body.references_in_a.length, 1);
			const new_result1 = (await rest_api.get(
				"/api/v1/collections/B?filter[number]=1"
			))[0];
			assert.equal(new_result1.body.references_in_a.length, 2);
		}));

	it("updates the cached value when an old reference is edited to an empty one", async () =>
		with_reverse(async ({ app, rest_api }) => {
			const result1 = (await rest_api.get(
				"/api/v1/collections/B?filter[number]=1"
			))[0];
			const result2 = (await rest_api.get(
				"/api/v1/collections/B?filter[number]=2"
			))[0];
			const referencing_id = result2.body.references_in_a[0];

			await rest_api.patch(`/api/v1/collections/A/${referencing_id}`, {
				reference_to_b: "",
			});
			const new_result2 = (await rest_api.get(
				"/api/v1/collections/B?filter[number]=2"
			))[0];
			assert.equal(new_result2.body.references_in_a.length, 1);
		}));

	it("allows to filter by a value of the referencing resource", async () =>
		with_reverse(async ({ app, rest_api }) => {
			let results = await rest_api.get(
				"/api/v1/collections/B?filter[references_in_a][pairity]=non-existant"
			);
			assert.equal(results.length, 0);
			results = await rest_api.get(
				"/api/v1/collections/B?filter[references_in_a][pairity]=odd"
			);
			assert.equal(results.length, 3);
			results = await rest_api.get(
				"/api/v1/collections/B?filter[references_in_a][pairity]=even&filter[number]=3"
			);
			assert.equal(results.length, 1);
		}));

	it("allows to display the full body of the referencing resources", async () =>
		with_reverse(async ({ app, rest_api }) => {
			let results = await rest_api.get(
				"/api/v1/collections/B?format[references_in_a]=expand"
			);
			assert(results[0].body.references_in_a[0].body);
		}));
});
