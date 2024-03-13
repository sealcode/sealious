import { strictEqual, deepStrictEqual } from "assert";
import { App, Collection, FieldTypes } from "../main";
import { sleep } from "../test_utils/sleep";
import { withRunningApp } from "../test_utils/with-test-app";

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
});
