import assert, { strictEqual, deepStrictEqual } from "assert";
import Int from "../app/base-chips/field-types/int.js";
import { App, Collection, FieldTypes, Policies, Query } from "../main.js";
import { sleep } from "../test_utils/sleep.js";
import { TestApp } from "../test_utils/test-app.js";
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
				const { items: desc } = await app.collections.entries
					.suList()
					.sort({ "_metadata.modified_at": "desc" })
					.fetch();

				strictEqual(desc[0]!.get("name"), "newer");
				strictEqual(desc[1]!.get("name"), "older");
				const { items: asc } = await app.collections.entries
					.suList()
					.sort({ "_metadata.modified_at": "asc" })
					.fetch();
				strictEqual(asc[0]!.get("name"), "older");
				strictEqual(asc[1]!.get("name"), "newer");
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
				deepStrictEqual(csv.split("\n")[0]!.split(",").sort(), [
					"age",
					"name",
				]);
				deepStrictEqual(csv.split("\n")[1]!.split(",").sort(), [
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
				assert.deepStrictEqual(result.items[0]!.number, 17);
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

	it("should return empty array if all referenced items have been deleted", async () =>
		withRunningApp(
			(test_app) => {
				const A = new (class extends Collection {
					name = "A";
					fields = {
						reference_to_b: new FieldTypes.SingleReference("B"),
					};
				})();
				const B = new (class extends Collection {
					name = "B";
					fields = { number: new FieldTypes.Int() };
				})();

				return class extends test_app {
					collections = {
						...TestApp.BaseCollections,
						A,
						B,
					};
				};
			},
			async ({ app }) => {
				const b = await app.collections.B.suCreate({ number: 2 });
				const a = await app.collections.A.suCreate({
					reference_to_b: b.id,
				});
				await b.delete(new app.SuperContext());
				const { items } = await app.collections.A.suList()
					.attach({ reference_to_b: true })
					.fetch();
				assert.strictEqual(items.length, 1);
				assert.deepStrictEqual(
					items[0]!.getAttachments("reference_to_b"),
					[]
				);
				assert.deepStrictEqual(
					items[0]!.getAttachments("reference_to_b").length,
					0
				);
			}
		));

	it("should use the 'show' policy when using .ids()", async () =>
		withRunningApp(
			(test_app) => {
				return class extends test_app {
					collections = {
						...TestApp.BaseCollections,
						posts: new (class extends Collection {
							name = "posts";
							fields = {
								title: new FieldTypes.Text(),
							};
							policies = {
								list: new Policies.Noone(),
								show: new Policies.Public(),
							};
						})(),
					};
				};
			},
			async ({ app }) => {
				const post = await app.collections.posts.suCreate({
					title: "Hello",
				});
				const { items } = await app.collections.posts
					.list(new app.Context())
					.ids([post.id])
					.fetch();
				assert.strictEqual(items.length, 1);
			}
		));

	it("should use the 'LIST' policy when using .list() without .ids()", async () =>
		withRunningApp(
			(test_app) => {
				return class extends test_app {
					collections = {
						...TestApp.BaseCollections,
						posts: new (class extends Collection {
							name = "posts";
							fields = {
								title: new FieldTypes.Text(),
							};
							policies = {
								list: new Policies.Noone(),
								show: new Policies.Public(),
							};
						})(),
					};
				};
			},
			async ({ app }) => {
				const post = await app.collections.posts.suCreate({
					title: "Hello",
				});
				const { items } = await app.collections.posts
					.list(new app.Context())
					.fetch();
				assert.strictEqual(items.length, 0);
			}
		));

	describe("fetchOne method", () => {
		it("should return the first item in correct order", async () =>
			withRunningApp(
				(test_app) =>
					class extends test_app {
						collections = {
							...App.BaseCollections,
							articles: new (class Items extends Collection {
								fields = {
									title: new FieldTypes.Text(),
								};
							})(),
						};
					},
				async ({ app }) => {
					const texts = ["first", "second", "third"];

					for (let i = 0; i < texts.length; i++) {
						await app.collections.articles.suCreate({
							title: texts[i],
						});
					}

					const item = await app.collections.articles
						.suList()
						.sort({ title: "asc" })
						.fetchOne();

					const itemDescended = await app.collections.articles
						.suList()
						.sort({ title: "desc" })
						.fetchOne();

					assert.strictEqual(item!.get("title"), "first");
					assert.strictEqual(itemDescended!.get("title"), "third");
				}
			));

		it("should return the first item or null depends on filter formula", async () =>
			withRunningApp(
				(test_app) =>
					class extends test_app {
						collections = {
							...App.BaseCollections,
							numbers: new (class Items extends Collection {
								fields = {
									item: new FieldTypes.Int(),
								};
							})(),
						};
					},
				async ({ app }) => {
					const items = [
						1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
						17, 18, 19, 20,
					];

					for (let i = 0; i < items.length; i++) {
						await app.collections.numbers.suCreate({
							item: items[i],
						});
					}

					const itemFilteredNotFound = await app.collections.numbers
						.suList()
						.filter({ item: { ">": 20 } })
						.fetchOne();

					const itemFilteredFound = await app.collections.numbers
						.suList()
						.filter({ item: { "<": 10 } })
						.sort({ item: "desc" })
						.fetchOne();

					assert.strictEqual(itemFilteredNotFound, null);
					assert.strictEqual(itemFilteredFound!.get("item"), 9);
				}
			));
	});
});
