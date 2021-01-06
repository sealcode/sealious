import assert from "assert";
import { withRunningApp } from "../test_utils/with-test-app";
import { assertThrowsAsync } from "../test_utils/assert-throws-async";
import { App, Collection, FieldTypes } from "../main";
import { TestAppType } from "../test_utils/test-app";
import { SerializedItemBody } from "../chip-types/collection-item";
import MockRestApi from "../test_utils/rest-api";

function extend(t: TestAppType) {
	return class extends t {
		collections = {
			...t.BaseCollections,
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
		items.baltic_sea = await rest_api.post(
			"/api/v1/collections/water_areas",
			{
				name: "Baltic Sea",
				temperature: 10,
			}
		);

		items.arabic_sea = await rest_api.post(
			"/api/v1/collections/water_areas",
			{
				name: "Arabic Sea",
				temperature: 20,
			}
		);

		const seals = [
			{
				name: "Hoover",
				favorite_number: 3,
				water_area: items.arabic_sea.id,
			},
			{
				name: "Maksiu",
				favorite_number: 3,
				water_area: items.baltic_sea.id,
			},
			{
				name: "Nelly",
				favorite_number: 8,
				water_area: items.baltic_sea.id,
			},
		];

		const promises = [];
		for (let seal of seals) {
			promises.push(app.collections.seals.suCreate(seal));
		}
		await Promise.all(promises);
	}

	it("properly sorts for correct sort key", async () => {
		return withRunningApp(extend, async ({ app, rest_api }) => {
			await create_resources(app, rest_api);
			const { items } = await rest_api.get(
				"/api/v1/collections/seals?sort[favorite_number]=desc"
			);

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
