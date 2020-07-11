import * as assert from "assert";

import { withRunningApp, MockRestApi } from "../../../test_utils/with-test-app";
import { App, Collection, Item, FieldTypes } from "../../../main";
import Matches from "./matches";

describe("Matches", () => {
	async function setup(app: App, rest_api: MockRestApi) {
		Collection.fromDefinition(app, {
			name: "numbers",
			fields: [
				{
					name: "number",
					type: FieldTypes.Int,
				},
			],
			named_filters: {
				positive: new Matches(app, () => app.collections.numbers, {
					number: { ">": 0 },
				}),
				negative: new Matches(app, () => app.collections.numbers, {
					number: { "<": 0 },
				}),
			},
		});

		const numbers = [-2, -1, 0, 1, 2];
		for (let number of numbers) {
			await rest_api.post("/api/v1/collections/numbers", { number });
		}
	}

	it("returns only positive numbers when using filter", () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app, rest_api);
			const sealious_response = await app.runAction(
				new app.SuperContext(),
				["collections", "numbers", "@positive"],
				"show"
			);
			assert.deepEqual(
				sealious_response.items.map(
					(resource: Item) => resource.number
				),
				[1, 2]
			);
		}));

	it("returns only positive numbers when using @positive filter", () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app, rest_api);
			const { items } = await rest_api.get(
				"/api/v1/collections/numbers/@positive?sort[number]=asc"
			);

			assert.deepEqual(
				items.map((resource: Item) => resource.number),
				[1, 2]
			);
		}));

	it("returns empty array when using both @positive and @negative filters", () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app, rest_api);
			const { items } = await rest_api.get(
				"/api/v1/collections/numbers/@positive/@negative"
			);
			assert.deepEqual(
				items.map((resource: Item) => resource.number),
				[]
			);
		}));
});
