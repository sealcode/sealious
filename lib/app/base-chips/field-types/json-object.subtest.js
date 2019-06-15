const assert = require("assert");
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const { with_running_app } = locreq("test_utils/with-test-app.js");
const assert_throws_async = locreq("test_utils/assert_throws_async.js");

describe("json-object", () => {
	function setup(app) {
		app.createChip(app.Sealious.Collection, {
			name: "seals",
			fields: [
				{
					name: "name",
					type: "text",
					required: true,
				},
				{
					name: "metadata",
					type: "json-object",
					required: true,
					params: {},
				},
			],
		});
	}

	it("Correctly adds and edits record with json field", async () =>
		with_running_app(async ({ app, rest_api }) => {
			setup(app);
			const item = {
				name: "Hoover",
				metadata: {
					gender: "male",
					weight: 300,
				},
			};
			const { id } = await rest_api.post(
				"/api/v1/collections/seals",
				item
			);

			let { name, metadata } = await rest_api.getSealiousResponse(
				`/api/v1/collections/seals/${id}`
			);
			assert.deepEqual({ name, metadata }, item);

			item.metadata.weight = 320;
			await rest_api.patch(`/api/v1/collections/seals/${id}`, item);

			({ name, metadata } = await rest_api.getSealiousResponse(
				`/api/v1/collections/seals/${id}`
			));

			assert.deepEqual({ name, metadata }, item);
		}));

	it("Doesn't allow to post a primitive", async () =>
		with_running_app(async ({ app, rest_api }) => {
			setup(app);
			await assert_throws_async(
				() =>
					rest_api.post("/api/v1/collections/seals", {
						name: "Hoover",
						metadata: "atadatem",
					}),
				e =>
					assert.equal(
						e.response.data.data.metadata.message,
						"A primitive, not an object!"
					)
			);
		}));

	it("Respects filter passed to query", async () =>
		with_running_app(async ({ app, rest_api }) => {
			setup(app);
			await rest_api.post("/api/v1/collections/seals", {
				name: "Hoover",
				metadata: {
					gender: "male",
					weight: 300,
				},
			});
			await rest_api.post("/api/v1/collections/seals", {
				name: "Maksiu",
				metadata: {
					gender: "male",
					weight: 280,
				},
			});

			let seals = (await rest_api.get("/api/v1/collections/seals")).items;
			assert.equal(seals.length, 2);

			seals = (await rest_api.get(
				"/api/v1/collections/seals?filter[name]=Hoover"
			)).items;
			assert.equal(seals[0].name, "Hoover");

			seals = (await rest_api.get(
				"/api/v1/collections/seals?filter[metadata][weight]=280"
			)).items;

			assert.equal(seals.length, 1);
			assert.equal(seals[0].name, "Maksiu");
		}));

	it("Respects filter passed to query when value can be parsed as number", async () =>
		with_running_app(async ({ app, rest_api }) => {
			setup(app);

			const seals = [
				{
					name: "Hoover",
					metadata: {
						gender: "male",
						weight: "300.253",
					},
				},
				{
					name: "Maksiu",
					metadata: {
						gender: "male",
						weight: "280",
					},
				},
			];

			for (let seal of seals) {
				await rest_api.post("/api/v1/collections/seals", seal);
			}

			for (let seal of seals) {
				let { items: actual_seals } = await rest_api.get(
					`/api/v1/collections/seals?filter[metadata][weight]=${
						seal.metadata.weight
					}`
				);

				assert.equal(actual_seals.length, 1);
				assert.equal(actual_seals[0].name, seal.name);
			}
		}));
});
