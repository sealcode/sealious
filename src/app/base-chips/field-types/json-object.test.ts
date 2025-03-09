import assert from "assert";
import {
	type TestAppConstructor,
	withRunningApp,
} from "../../../test_utils/with-test-app.js";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async.js";
import { Collection, FieldTypes } from "../../../main.js";
import { TestApp } from "../../../test_utils/test-app.js";

function extend(t: TestAppConstructor) {
	return class extends t {
		collections = {
			...TestApp.BaseCollections,
			seals: new (class extends Collection {
				fields = {
					name: new FieldTypes.Text(),
					metadata: new FieldTypes.JsonObject(),
				};
			})(),
		};
	};
}

describe("json-object", () => {
	it("Correctly adds and edits record with json field", async () =>
		withRunningApp(extend, async ({ rest_api }) => {
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

			let {
				items: [{ name, metadata }],
			} = (await rest_api.get(`/api/v1/collections/seals/${id}`)) as any;
			assert.deepEqual({ name, metadata }, item);

			item.metadata.weight = 320;
			await rest_api.patch(`/api/v1/collections/seals/${id}`, item);

			let {
				items: [{ name: name2, metadata: metadata2 }],
			} = (await rest_api.get(`/api/v1/collections/seals/${id}`)) as any;

			assert.deepEqual({ name: name2, metadata: metadata2 }, item);
		}));

	it("Doesn't allow to post a primitive", async () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			await assertThrowsAsync(
				() =>
					rest_api.post("/api/v1/collections/seals", {
						name: "Hoover",
						metadata: "atadatem",
					}),
				(e) =>
					assert.equal(
						e.response.data.data.field_messages.metadata.message,
						app.i18n("invalid_json_object")
					)
			);
		}));

	it("Respects filter passed to query", async () =>
		withRunningApp(extend, async ({ rest_api }) => {
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
		withRunningApp(extend, async ({ rest_api }) => {
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
