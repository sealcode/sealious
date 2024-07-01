import assert, { strictEqual, deepStrictEqual } from "assert";
import Int from "../app/base-chips/field-types/int.js";
import { App, Collection, FieldTypes, Query } from "../main.js";
import { sleep } from "../test_utils/sleep.js";
import { withRunningApp } from "../test_utils/with-test-app.js";

class Entries extends Collection {
	fields = {
		name: new FieldTypes.Text(),
	};
}

class EntriesCSV extends Collection {
	fields = {
		name: new FieldTypes.Text(),
		age: new FieldTypes.Int(),
	};
}

describe("ItemList", () => {
	it("allows to sort by modified_date", () =>
		withRunningApp(
			(test_app) =>
				class extends test_app {
					collections = {
						...App.BaseCollections,
						entries: new Entries(),
					};
				},
			async ({ app }) => {
				await app.collections.entries.suCreate({ name: "older" });
				await sleep(100);
				await app.collections.entries.suCreate({ name: "newer" });
				const { items: desc } = await (
					app.collections.entries as Entries
				)
					.suList()
					.sort({ "_metadata.modified_at": "desc" })
					.fetch();

				strictEqual(desc[0].get("name"), "newer");
				strictEqual(desc[1].get("name"), "older");
				const { items: asc } = await app.collections.entries
					.suList()
					.sort({ "_metadata.modified_at": "asc" })
					.fetch();
				strictEqual(asc[0].get("name"), "older");
				strictEqual(asc[1].get("name"), "newer");
			}
		));

	it("properly parses params in HTTP GET", () =>
		withRunningApp(
			(test_app) =>
				class extends test_app {
					collections = {
						...App.BaseCollections,
						entries: new Entries(),
					};
				},
			async ({ rest_api }) => {
				// shouldn't throw
				await rest_api.get(
					"/api/v1/collections/entries?pagination[items]=10"
				);
			}
		));
	it("generate CSV string", () =>
		withRunningApp(
			(test_app) =>
				class extends test_app {
					collections = {
						...App.BaseCollections,
						entries: new EntriesCSV(),
					};
				},
			async ({ app }) => {
				await app.collections.entries.suCreate({
					name: "older",
					age: 15,
				});
				const csv = await app.collections.entries.suList().toCSV();
				deepStrictEqual(csv.split("\n")[0].split(",").sort(), [
					"age",
					"name",
				]);
				deepStrictEqual(csv.split("\n")[1].split(",").sort(), [
					"15",
					"older",
				]);
			}
		));

	it("allows to add a custom aggregation stage", async () =>
		withRunningApp(
			(test_app) =>
				class extends test_app {
					collections = {
						...App.BaseCollections,
						entries: new (class extends Collection {
							fields = {
								number: new Int(),
							};
						})(),
					};
				},
			async ({ app }) => {
				await app.collections.entries.suCreate({
					number: 15,
				});
				await app.collections.entries.suCreate({
					number: 16,
				});
				await app.collections.entries.suCreate({
					number: 17,
				});
				const result = (
					await app.collections.entries
						.suList()
						.filter({ number: { ">": 15 } })
						.addCustomAggregationStages(
							Query.fromSingleMatch({
								number: { $gt: 16 },
							}).toPipeline()
						)
						.fetch()
				).serialize();
				assert.deepStrictEqual(result.items.length, 1);
				assert.deepStrictEqual(result.items[0].number, 17);
			}
		));

	it("should return the items in the order they were provided in the .ids() function", async () =>
		withRunningApp(
			(test_app) =>
				class extends test_app {
					collections = {
						...App.BaseCollections,
						entries: new (class extends Collection {
							fields = {
								number: new Int(),
							};
						})(),
					};
				},
			async ({ app }) => {
				const one = await app.collections.entries.suCreate({
					number: 1,
				});
				const two = await app.collections.entries.suCreate({
					number: 1,
				});
				const result1 = await app.collections.entries
					.suList()
					.ids([one.id, two.id])
					.fetch();
				assert.deepStrictEqual(
					result1.items.map(({ id }) => id),
					[one.id, two.id]
				);
				const result2 = await app.collections.entries
					.suList()
					.ids([two.id, one.id])
					.fetch();
				assert.deepStrictEqual(
					result2.items.map(({ id }) => id),
					[two.id, one.id]
				);
			}
		));
});
