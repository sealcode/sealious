import * as assert from "assert";

import { withRunningApp } from "../../../test_utils/with-test-app";
import { Collection, FieldTypes } from "../../../main";
import Matches from "./matches";
import { TestAppType } from "../../../test_utils/test-app";
import { SerializedItemBody } from "../../../chip-types/collection-item";
import MockRestApi from "../../../test_utils/rest-api";

function extend(t: TestAppType) {
	return class extends t {
		collections = {
			...t.BaseCollections,
			numbers: new (class extends Collection {
				fields = {
					number: new FieldTypes.Int(),
				};
				named_filters = {
					positive: new Matches("numbers", {
						number: { ">": 0 },
					}),
					negative: new Matches("numbers", {
						number: { "<": 0 },
					}),
				};
			})(),
		};
	};
}

describe("Matches", () => {
	async function setup(rest_api: MockRestApi) {
		const numbers = [-2, -1, 0, 1, 2];
		for (let number of numbers) {
			await rest_api.post("/api/v1/collections/numbers", { number });
		}
	}

	it("returns only positive numbers when using filter", () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			await setup(rest_api);
			const sealious_response = await app.collections.numbers
				.suList()
				.namedFilter("positive")
				.fetch();

			assert.deepEqual(
				sealious_response.items.map((resource) =>
					resource.get("number")
				),
				[1, 2]
			);
		}));

	it("returns only positive numbers when using @positive filter", () =>
		withRunningApp(extend, async ({ rest_api }) => {
			await setup(rest_api);
			const { items } = await rest_api.get(
				"/api/v1/collections/numbers/@positive?sort[number]=asc"
			);

			assert.deepEqual(
				items.map((resource: SerializedItemBody) => resource.number),
				[1, 2]
			);
		}));

	it("returns empty array when using both @positive and @negative filters", () =>
		withRunningApp(extend, async ({ rest_api }) => {
			await setup(rest_api);
			const { items } = await rest_api.get(
				"/api/v1/collections/numbers/@positive/@negative"
			);
			assert.deepEqual(
				items.map((resource: SerializedItemBody) => resource.number),
				[]
			);
		}));
});
