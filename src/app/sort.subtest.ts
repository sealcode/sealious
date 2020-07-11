import assert from "assert";
import { withRunningApp, MockRestApi } from "../test_utils/with-test-app";
import { assertThrowsAsync } from "../test_utils/assert-throws-async";
import {
	App,
	Item,
	Collection,
	FieldTypes,
	FieldDefinitionHelper as field,
} from "../main";
import { CollectionResponse } from "../../common_lib/response/responses";

describe("sorting", () => {
	const items: { [name: string]: Item } = {};
	async function create_resources(app: App, rest_api: MockRestApi) {
		Collection.fromDefinition(app, {
			name: "water_areas",
			fields: [
				field("name", FieldTypes.Text, {}, true),
				field("temperature", FieldTypes.Int, {}, true),
			],
		});

		Collection.fromDefinition(app, {
			name: "seals",
			fields: [
				field("name", FieldTypes.Text, {}, true),
				field("favorite_number", FieldTypes.Int, {}, true),
				field("water_area", FieldTypes.SingleReference, {
					target_collection: () => app.collections.water_areas,
				}),
			],
		});

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

		for (let seal of seals) {
			await app.runAction(
				new app.SuperContext(),
				["collections", "seals"],
				"create",
				seal
			);
		}
	}
	it("properly sorts for correct sort key", async () =>
		withRunningApp(async ({ app, rest_api }) => {
			await create_resources(app, rest_api);
			const { items } = (await rest_api.get(
				"/api/v1/collections/seals?sort[favorite_number]=desc"
			)) as CollectionResponse;

			assert.deepEqual(
				items.map((item) => item.favorite_number),
				[8, 3, 3]
			);
		}));

	it("throws application error for incorrect sort key", async () =>
		withRunningApp(async ({ app, rest_api }) => {
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
						"Unknown sort key: dsc. Available sort keys are: desc, descending, asc, ascending."
					);
				}
			);
		}));
});
