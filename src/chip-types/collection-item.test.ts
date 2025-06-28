import assert from "assert";
import {
	App,
	Collection,
	Context,
	Fieldset,
	FieldTypes,
	SuperContext,
} from "../main.js";
import { assertThrowsAsync } from "../test_utils/assert-throws-async.js";
import { withRunningApp } from "../test_utils/with-test-app.js";

describe("CollectionItem", () => {
	it("first inserts, then updates on successive .save() calls", async () =>
		withRunningApp(
			(test_app) =>
				class extends test_app {
					collections = {
						...App.BaseCollections,
						entries: new (class extends Collection {
							fields = { title: new FieldTypes.Text() };
						})(),
					};
				},
			async ({ app }) => {
				const entry = await app.collections.entries.suCreate({
					title: "title",
				});
				entry.set("title", "title2");
				await entry.save(new SuperContext(app));
				const { items: entries } = await app.collections.entries
					.suList()
					.fetch();
				assert.strictEqual(entries.length, 1);
				assert.strictEqual(entries[0]!.get("title"), "title2");
			}
		));

	it("first inserts, then updates on successive .save() calls (in after:create hook)", async () =>
		withRunningApp(
			(test_app) =>
				class extends test_app {
					collections = {
						...App.BaseCollections,
						entries: new (class extends Collection {
							fields = { title: new FieldTypes.Text() };
							async init(app: App, name: string) {
								await super.init(app, name);
								this.on("after:create", async ([_, entry]) => {
									entry.set("title", "title-overwritten");
									await entry.save(new SuperContext(app));
								});
							}
						})(),
					};
				},
			async ({ app }) => {
				const entry = await app.collections.entries.suCreate({
					title: "title",
				});
				await entry.save(new SuperContext(app));
				const { items: entries } = await app.collections.entries
					.suList()
					.fetch();
				assert.strictEqual(entries.length, 1);
				assert.strictEqual(
					entries[0]!.get("title"),
					"title-overwritten"
				);
			}
		));

	it("enables using custom validation ran after individual fields validation", async () =>
		withRunningApp(
			(test_app) =>
				class extends test_app {
					collections = {
						...App.BaseCollections,
						entries: new (class extends Collection {
							fields = {
								title: new FieldTypes.Text(),
								length: new FieldTypes.Int(),
							};
							async validate() {
								return [
									{
										error: "length of the 'title' should be equal to 'length'",
										fields: ["title", "length"],
									},
								];
							}
						})(),
					};
				},
			async ({ app }) => {
				await assertThrowsAsync(
					() =>
						app.collections.entries.suCreate({
							title: "one",
							length: 4,
						}),
					(e) => {
						assert.strictEqual(e.message, "Invalid field values");
						assert.deepStrictEqual(e.data, {
							collection: "entries",
							other_messages: [],
							field_messages: {
								title: {
									message:
										"length of the 'title' should be equal to 'length'",
								},
								length: {
									message:
										"length of the 'title' should be equal to 'length'",
								},
							},
						});
					}
				);
			}
		));

	it("works correctly with examples from docs", async () =>
		withRunningApp(
			(test_app) =>
				class extends test_app {
					collections = {
						...App.BaseCollections,
						entries: new (class extends Collection {
							fields = {
								color: new FieldTypes.Color(),
							};
							async validate(_: Context, body: Fieldset<any>) {
								if (
									(body.getInput("color") as string).includes(
										"green"
									)
								) {
									return [
										{
											error: "Green is not a creative color",
											fields: ["color"],
										},
									];
								}
								return [];
							}
						})(),
					};
				},
			async ({ app }) => {
				await assertThrowsAsync(
					() =>
						app.collections.entries.suCreate({
							color: "green",
						}),
					(e) => {
						assert.strictEqual(e.message, "Invalid field values");
						assert.deepStrictEqual(e.data, {
							collection: "entries",
							other_messages: [],
							field_messages: {
								color: {
									message: "Green is not a creative color",
								},
							},
						});
					}
				);
			}
		));

	it("lets you enter a value to a field that was null before", async () =>
		withRunningApp(
			(test_app) =>
				class extends test_app {
					collections = {
						...App.BaseCollections,
						entries: new (class extends Collection {
							fields = {
								name: new FieldTypes.Text(),
								surname: new FieldTypes.Text(),
								spirit_animal: new FieldTypes.Text(),
							};
						})(),
					};
				},
			async ({ app }) => {
				let ala = await app.collections.entries.suCreate({
					name: "Ala",
					surname: "Makota",
				});

				ala = await app.collections.entries.suGetByID(ala.id);
				ala.set("spirit_animal", "kot");
				await ala.save(new app.SuperContext());
				ala = await app.collections.entries.suGetByID(ala.id);
				assert.strictEqual(ala.get("spirit_animal"), "kot");
			}
		));

	describe("summarizeChanges", () => {
		it("shows changes from raw input", async () =>
			withRunningApp(
				(test_app) =>
					class extends test_app {
						collections = {
							...App.BaseCollections,
							entries: new (class extends Collection {
								fields = {
									name: new FieldTypes.Text(),
									surname: new FieldTypes.Text(),
									spirit_animal: new FieldTypes.Text(),
								};
							})(),
						};
					},
				async ({ app }) => {
					let ala = await app.collections.entries.suCreate({
						name: "Ala",
						surname: "Makota",
					});

					ala = await app.collections.entries.suGetByID(ala.id);
					ala.set("spirit_animal", "kot");
					const changes = await ala.summarizeChanges(
						new app.SuperContext()
					);
					assert.deepStrictEqual(changes, {
						spirit_animal: { was: null, is: "kot" },
					});
				}
			));

		it("skips fields with identical values", async () =>
			withRunningApp(
				(test_app) =>
					class extends test_app {
						collections = {
							...App.BaseCollections,
							entries: new (class extends Collection {
								fields = {
									name: new FieldTypes.Text(),
									surname: new FieldTypes.Text(),
									spirit_animal: new FieldTypes.Text(),
								};
							})(),
						};
					},
				async ({ app }) => {
					let ala = await app.collections.entries.suCreate({
						name: "Ala",
						surname: "Makota",
					});

					ala = await app.collections.entries.suGetByID(ala.id);
					ala.set("spirit_animal", "kot");
					ala.set("surname", "Makota");
					const changes = await ala.summarizeChanges(
						new app.SuperContext()
					);
					assert.deepStrictEqual(changes, {
						// there should be no mention of surname change
						spirit_animal: { was: null, is: "kot" },
					});
				}
			));
	});

	it("properly maps types for the fields", async () =>
		withRunningApp(
			(test_app) =>
				class extends test_app {
					collections = {
						...App.BaseCollections,
						entries: new (class extends Collection {
							fields = {
								number: new FieldTypes.Int(),
								string: new FieldTypes.Text(),
								required_number:
									new FieldTypes.Int().setRequired(true),
								markdown: new FieldTypes.Markdown().setRequired(
									true
								),
							};
						})(),
					};
				},
			async ({ app }) => {
				let ala = await app.collections.entries.suCreate({
					string: "text",
					number: 123,
					required_number: 2,
					markdown: "**hehe**",
				});

				const {
					items: [ala_result],
				} = await app.collections.entries
					.suList()
					.ids([ala.id])
					.fetch();

				ala_result!.get("string")?.padStart(0, "0");
				ala_result!.get("number")?.toExponential(2);
				ala.get("number")?.toExponential(2);
				ala.get("required_number").toExponential(2);
				ala.get("markdown").padStart(10);
			}
		));

	it("Should not throw an error claiming the attachments for a field were not loaded if they in fact were loaded but the results are empty", async () =>
		withRunningApp(
			(test_app) =>
				class extends test_app {
					collections = {
						...App.BaseCollections,
						posts: new (class extends Collection {
							fields = {
								title: new FieldTypes.Text(),
								comments: new FieldTypes.ReverseSingleReference(
									{
										referencing_collection: "comments",
										referencing_field: "post",
									}
								),
							};
						})(),
						comments: new (class extends Collection {
							fields = {
								content: new FieldTypes.Text(),
								post: new FieldTypes.SingleReference("posts"),
							};
						})(),
					};
				},
			async ({ app }) => {
				const { id: item_id } = await app.collections.posts.suCreate({
					title: "How to jump",
				});
				const item = await app.collections.posts.suGetByID(item_id);

				await item.loadAttachments(
					new app.SuperContext(),
					{
						comments: true,
					},
					{}
				);

				const attachments = item.getAttachments("comments");
				assert.deepStrictEqual(attachments, []);
			}
		));
});
