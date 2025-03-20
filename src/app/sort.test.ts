import assert from "assert";
import {
	type TestAppConstructor,
	withRunningApp,
} from "../test_utils/with-test-app.js";
import { assertThrowsAsync } from "../test_utils/assert-throws-async.js";
import { App, Collection, FieldTypes } from "../main.js";
import type { SerializedItemBody } from "../chip-types/collection-item.js";
import type MockRestApi from "../test_utils/rest-api.js";
import { TestApp } from "../test_utils/test-app.js";

function extend(t: TestAppConstructor) {
	return class extends t {
		collections = {
			...TestApp.BaseCollections,
			water_areas: new (class extends Collection {
				fields = {
					name: new FieldTypes.Text(),
					temperature: new FieldTypes.Int(),
				};
			})(),

			seals: new (class extends Collection {
				fields = {
					name: new FieldTypes.Text(),
					favorite_number: new FieldTypes.Int(),
					water_area: new FieldTypes.SingleReference("water_areas"),
				};
			})(),
		};
	};
}

describe("sorting", () => {
	const items: { [name: string]: SerializedItemBody } = {};
	async function create_resources(app: App, rest_api: MockRestApi) {
		items.baltic_sea = (await rest_api.post(
			"/api/v1/collections/water_areas",
			{
				name: "Baltic Sea",
				temperature: 10,
			}
		)) as any;

		items.arabic_sea = (await rest_api.post(
			"/api/v1/collections/water_areas",
			{
				name: "Arabic Sea",
				temperature: 20,
			}
		)) as any;

		const seals = [
			{
				name: "Hoover",
				favorite_number: 3,
				water_area: items.arabic_sea!.id,
			},
			{
				name: "Maksiu",
				favorite_number: 3,
				water_area: items.baltic_sea!.id,
			},
			{
				name: "Nelly",
				favorite_number: 8,
				water_area: items.baltic_sea!.id,
			},
		];

		const promises = [];
		for (let seal of seals) {
			promises.push(app.collections.seals!.suCreate(seal));
		}
		await Promise.all(promises);
	}

	it("properly sorts for correct sort key", async () => {
		return withRunningApp(extend, async ({ app, rest_api }) => {
			await create_resources(app, rest_api);
			const { items } = (await rest_api.get(
				"/api/v1/collections/seals?sort[favorite_number]=desc"
			)) as any;

			assert.deepEqual(
				items.map((item: any) => item.favorite_number),
				[8, 3, 3]
			);
		});
	});

	it("throws application error for incorrect sort key", async () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			await create_resources(app, rest_api);

			await assertThrowsAsync(
				async () =>
					await rest_api.get(
						"/api/v1/collections/seals?sort[favorite_number]=dsc"
					),
				(e) => {
					assert.equal(e.response.status, 405);
					assert.equal(
						e.response.data.message,
						`Unknown sort key: "dsc". Available sort keys are: desc, descending, asc, ascending.`
					);
				}
			);
		}));
});
