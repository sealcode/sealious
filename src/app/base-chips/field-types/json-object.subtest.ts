import assert from "assert";
import { withRunningApp } from "../../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async";
import { App, Collection, FieldTypes } from "../../../main";

describe("json-object", () => {
	function setup(app: App) {
		Collection.fromDefinition(app, {
			name: "seals",
			fields: [
				{
					name: "name",
					type: FieldTypes.Text,
					required: true,
				},
				{
					name: "metadata",
					type: FieldTypes.JsonObject,
					required: true,
					params: {},
				},
			],
		});
	}

	it("Correctly adds and edits record with json field", async () =>
		withRunningApp(async ({ app, rest_api }) => {
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

			let { name, metadata } = (await rest_api.getSealiousResponse(
				`/api/v1/collections/seals/${id}`
			)) as any;
			assert.deepEqual({ name, metadata }, item);

			item.metadata.weight = 320;
			await rest_api.patch(`/api/v1/collections/seals/${id}`, item);

			let {
				name: name2,
				metadata: metadata2,
			} = (await rest_api.getSealiousResponse(
				`/api/v1/collections/seals/${id}`
			)) as any;

			assert.deepEqual({ name: name2, metadata: metadata2 }, item);
		}));

	it("Doesn't allow to post a primitive", async () =>
		withRunningApp(async ({ app, rest_api }) => {
			setup(app);
			await assertThrowsAsync(
				() =>
					rest_api.post("/api/v1/collections/seals", {
						name: "Hoover",
						metadata: "atadatem",
					}),
				(e) =>
					assert.equal(
						e.response.data.data.metadata.message,
						"A primitive, not an object!"
					)
			);
		}));

	it("Respects filter passed to query", async () =>
		withRunningApp(async ({ app, rest_api }) => {
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

			seals = (
				await rest_api.get(
					"/api/v1/collections/seals?filter[name]=Hoover"
				)
			).items;

			assert.equal(seals[0].name, "Hoover");

			seals = (
				await rest_api.get(
					"/api/v1/collections/seals?filter[metadata][weight]=280"
				)
			).items;

			assert.equal(seals.length, 1);
			assert.equal(seals[0].name, "Maksiu");
		}));

	it("Respects filter passed to query when value can be parsed as number", async () =>
		withRunningApp(async ({ app, rest_api }) => {
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
					`/api/v1/collections/seals?filter[metadata][weight]=${seal.metadata.weight}`
				);

				assert.equal(actual_seals.length, 1);
				assert.equal(actual_seals[0].name, seal.name);
			}
		}));
});
