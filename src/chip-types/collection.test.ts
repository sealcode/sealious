import { hasShape, predicates } from "@sealcode/ts-predicates";
import assert from "assert";
import prettier from "prettier";
import Int from "../app/base-chips/field-types/int.js";
import { App, Context, FieldTypes, Policies } from "../main.js";
import { assertThrowsAsync } from "../test_utils/assert-throws-async.js";
import { sleep } from "../test_utils/sleep.js";
import type { TestApp } from "../test_utils/test-app.js";
import {
	withRunningApp,
	withStoppedApp,
	type TestAppConstructor,
} from "../test_utils/with-test-app.js";
import Collection, { type FieldEntryMapping } from "./collection.js";

type Policies = Collection["policies"];

function extend(t: TestAppConstructor<TestApp>, passedPolicies: Policies = {}) {
	return class extends t {
		collections = {
			...App.BaseCollections,
			coins: new (class extends Collection {
				fields = { value: new Int() };
				policies = passedPolicies;
			})(),
		};
	};
}

describe("collection router", () => {
	it("propertly responds to a GET request to list resources", async () =>
		withRunningApp(extend, async ({ rest_api }) => {
			await rest_api.post("/api/v1/collections/coins", { value: 2 });
			const response = await rest_api.get("/api/v1/collections/coins");
			if (
				!hasShape(
					{
						items: predicates.array(
							predicates.shape({
								id: predicates.string,
								value: predicates.number,
							})
						),
					},
					response
				)
			) {
				throw new Error("Wrong reponse shape");
			}
			assert.ok(response.items[0]!.id);
			assert.strictEqual(response.items[0]!.value, 2);
		}));
});

describe("policy sharing for list and show", () => {
	it("proper inheritance of list policy from show policy", () => {
		return withRunningApp(
			(t) => {
				return extend(t, { show: new Policies.Noone() });
			},
			async ({ app }) => {
				assert.strictEqual(
					app.collections.coins.getPolicy("list") instanceof
						Policies.Noone,
					true
				);
			}
		);
	});
	it("proper inheritance of show policy from list policy", () => {
		return withRunningApp(
			(t) => {
				return extend(t, { list: new Policies.Noone() });
			},
			async ({ app }) => {
				assert.strictEqual(
					app.collections.coins.getPolicy("show") instanceof
						Policies.Noone,
					true
				);
			}
		);
	});

	it("action policy is favoured over inherited policy", () => {
		return withRunningApp(
			(t) => {
				return extend(t, {
					list: new Policies.Noone(),
					show: new Policies.LoggedIn(),
				});
			},
			async ({ app }) => {
				assert.strictEqual(
					app.collections.coins.getPolicy("list") instanceof
						Policies.Noone,
					true
				);
			}
		);
	});
});

describe("types", () => {
	it("throws a ts error when a required field is missing", () => {
		// this test does not have to run in runitme, just creating a code structure to reflect the use case mentioned here: https://forum.sealcode.org/t/sealious-problem-z-typami/1399/3

		return withRunningApp(
			(t: TestAppConstructor<TestApp>) =>
				class TheApp extends t {
					collections = {
						...App.BaseCollections,
						withRequired:
							new (class withRequired extends Collection {
								fields = {
									required: FieldTypes.Required(
										new FieldTypes.Int()
									),
								};
							})(),
					};
				},
			async ({ app }) => {
				await app.collections.withRequired.create(
					new app.SuperContext(),
					{ required: 2 } // try removing or renaming this property and you should get an error
				);
				await app.collections.withRequired.suCreate({ required: 2 });
			}
		);
	});

	it("doesn't throw a ts error when a non-required field is missing", () => {
		return withRunningApp(
			(t: TestAppConstructor<TestApp>) =>
				class TheApp extends t {
					collections = {
						...App.BaseCollections,
						withRequired:
							new (class withRequired extends Collection {
								fields = {
									nonrequired: new FieldTypes.Int(),
								};
							})(),
					};
				},
			async ({ app }) => {
				await app.collections.withRequired.create(
					new app.SuperContext(),
					{}
				);
			}
		);
	});
});

describe("collection", () => {
	describe("initFieldDetails", () => {
		it("should throw error when field name contains colon", async () =>
			withStoppedApp(
				(t) =>
					class extends t {
						collections = {
							...App.BaseCollections,
							patrons: new (class extends Collection {
								fields = {
									email: new FieldTypes.Email(),
									"amount:monthly": new FieldTypes.Float(),
								};
							})(),
						};
					},

				async ({ app }) => {
					await assertThrowsAsync(
						async () => {
							await app.start();
						},
						async (e) => {
							assert.strictEqual(
								e.message,
								"Field names cannot contain the `:` character."
							);
						}
					);
				}
			));
	});

	describe("removeByID", () => {
		it("calls after:remove", async () =>
			withRunningApp(
				(t) =>
					class extends t {
						collections = {
							...App.BaseCollections,
							test: new (class extends Collection {
								fields = {};
							})(),
						};
					},
				async ({ app }) => {
					let called = false;
					app.collections.test.on("after:remove", async () => {
						called = true;
					});
					const item = await app.collections.test.suCreate({});
					await app.collections.test.suRemoveByID(item.id);
					assert.strictEqual(called, true);
				}
			));
	});
	describe("getByID", () => {
		it("throws an ugly error by default", async () => {
			return withRunningApp(
				(t) =>
					extend(t, {
						create: new Policies.Public(),
						show: new Policies.Owner(),
					}),
				async ({ app }) => {
					const collection = "coins";
					const item = await app.collections[collection].suCreate({
						value: 1,
					});

					const guest = await app.collections.users.suCreate({
						password: "12345678",
						username: "Adam",
					});

					const guestContext = new Context({
						app,
						user_id: guest.id,
					});
					await assertThrowsAsync(
						async () => {
							await app.collections.coins.getByID(
								guestContext,
								item.id
							);
						},
						async (e) => {
							assert.strictEqual(
								e.message,
								`${collection}: id ${item.id} not found`
							);
						}
					);
				}
			);
		});
	});

	it("throws an nice error when ordered to", async () => {
		return withRunningApp(
			(t) =>
				extend(t, {
					create: new Policies.Public(),
					show: new Policies.Owner(),
				}),
			async ({ app }) => {
				const collection = "coins";
				const item = await app.collections[collection].suCreate({
					value: 1,
				});

				const guest = await app.collections.users.suCreate({
					password: "12345678",
					username: "Adam",
				});

				const guestContext = new Context({
					app,
					user_id: guest.id,
				});
				await assertThrowsAsync(
					async () => {
						await app.collections.coins.getByID(
							guestContext,
							item.id,
							true
						);
					},
					async (e) => {
						assert.strictEqual(
							e.message,
							`You're not the user who created this item`
						);
					}
				);
			}
		);
	});

	describe("upsert", () => {
		it("creates new items and updates the old ones", () =>
			withRunningApp(
				(t) =>
					class extends t {
						collections = {
							...App.BaseCollections,
							patrons: new (class extends Collection {
								fields = {
									email: new FieldTypes.Email(),
									amount_monthly: new FieldTypes.Float(),
									end_date: new FieldTypes.Date(),
								};
							})(),
						};
					},

				async ({ app }) => {
					await app.collections.patrons.upsert(
						new app.SuperContext(),
						"email",
						[
							{
								email: "adam@example.com",
								amount_monthly: 3,
								end_date: "2023-12-24",
							},
							{
								email: "eve@example.com",
								amount_monthly: 7,
								end_date: "2024-10-13",
							},
						]
					);
					await app.collections.patrons.upsert(
						new app.SuperContext(),
						"email",
						[
							{
								email: "adam@example.com",
								end_date: "2024-12-24", // one year later
							},
						]
					);
					const { items: patrons } = await app.collections.patrons
						.suList()
						.sort({ email: "asc" })
						.fetch();
					assert.strictEqual(patrons.length, 2);
					assert.strictEqual(
						patrons[0]!.get("email"),
						"adam@example.com"
					);
					assert.strictEqual(
						patrons[0]!.get("end_date"),
						"2024-12-24"
					);
					assert.strictEqual(
						patrons[1]!.get("email"),
						"eve@example.com"
					);
					assert.strictEqual(patrons[1]!.get("amount_monthly"), 7);
				}
			));

		it("updates only the resources that actually have any changes", async () =>
			withRunningApp(
				(t) =>
					class extends t {
						collections = {
							...App.BaseCollections,
							patrons: new (class extends Collection {
								fields = {
									email: new FieldTypes.Email(),
									amount_monthly: new FieldTypes.Float(),
									end_date: new FieldTypes.Date(),
								};
							})(),
						};
					},

				async ({ app }) => {
					await app.collections.patrons.upsert(
						new app.SuperContext(),
						"email",
						[
							{
								email: "adam@example.com",
								amount_monthly: 3,
								end_date: "2023-12-24",
							},
							{
								email: "eve@example.com",
								amount_monthly: 7,
								end_date: "2024-10-13",
							},
						]
					);
					let edits = 0;
					app.collections.patrons.on("before:edit", async () => {
						edits++;
					});
					await app.collections.patrons.upsert(
						new app.SuperContext(),
						"email",
						[
							{
								email: "adam@example.com",
								amount_monthly: 3,
								end_date: "2023-12-24",
							},
						]
					);
					assert.strictEqual(edits, 0);
					await app.collections.patrons.upsert(
						new app.SuperContext(),
						"email",
						[
							{
								email: "adam@example.com",
								amount_monthly: 7,
								end_date: "2023-12-24",
							},
						]
					);
					assert.strictEqual(edits, 1);
				}
			));

		it("only sets the fields that hve changed, doesn't submit the fields whose value is same as before", async () =>
			withRunningApp(
				(t) =>
					class extends t {
						collections = {
							...App.BaseCollections,
							patrons: new (class extends Collection {
								fields = {
									email: new FieldTypes.Email(),
									amount_monthly: new FieldTypes.Float(),
									end_date: new FieldTypes.Date(),
								};
							})(),
						};
					},

				async ({ app }) => {
					await app.collections.patrons.upsert(
						new app.SuperContext(),
						"email",
						[
							{
								email: "adam@example.com",
								amount_monthly: 3,
								end_date: "2023-12-24",
							},
						]
					);
					let changes;
					app.collections.patrons.on(
						"before:edit",
						async function ([context, item]) {
							changes = await item.summarizeChanges(context);
						}
					);
					await app.collections.patrons.upsert(
						new app.SuperContext(),
						"email",
						[
							{
								email: "adam@example.com",
								amount_monthly: 3,
								end_date: "2023-12-24",
							},
						]
					);
					await app.collections.patrons.upsert(
						new app.SuperContext(),
						"email",
						[
							{
								email: "adam@example.com",
								amount_monthly: 7,
								end_date: "2023-12-24",
							},
						]
					);
					assert.deepStrictEqual(changes, {
						amount_monthly: { was: 3, is: 7 },
					});
				}
			));

		it("only sets the fields that hve changed, doesn't submit the fields whose value is same as before, even when they are encoded differently", async () =>
			withRunningApp(
				(t) =>
					class extends t {
						collections = {
							...App.BaseCollections,
							patrons: new (class extends Collection {
								fields = {
									email: new FieldTypes.Email(),
									amount_monthly: new FieldTypes.Float(),
									end_date: new FieldTypes.Date(),
								};
							})(),
						};
					},

				async ({ app }) => {
					await app.collections.patrons.upsert(
						new app.SuperContext(),
						"email",
						[
							{
								email: "adam@example.com",
								amount_monthly: 3,
								end_date: "2023-12-24",
							},
						]
					);
					let changes;
					app.collections.patrons.on(
						"before:edit",
						async function ([context, item]) {
							changes = await item.summarizeChanges(context);
						}
					);
					await app.collections.patrons.upsert(
						new app.SuperContext(),
						"email",
						[
							{
								email: "adam@example.com",
								amount_monthly: "3",
								end_date: "2023-12-24",
							},
						]
					);

					assert.deepStrictEqual(changes, undefined);
				}
			));
	});

	describe("atom feed", () => {
		it("generates a valid XML feed for a list of blog items", async () =>
			withRunningApp(
				(t) =>
					class extends t {
						collections = {
							...App.BaseCollections,
							posts: new (class extends Collection {
								fields = {
									title: new FieldTypes.Text(),
									content: new FieldTypes.Text(),
								};
							})(),
						};
					},

				async ({ app, rest_api }) => {
					await app.collections.posts.upsert(
						new app.SuperContext(),
						"title",
						[
							{
								title: "article 1",
								content: "article 1 content",
							},
						]
					);
					// to maintain proper sorting based on timestamps
					await sleep(100);
					await app.collections.posts.upsert(
						new app.SuperContext(),
						"title",
						[
							{
								title: "article 2",
								content: "article 2 content",
							},
						]
					);
					const atom_feed = await rest_api.get(
						"/api/v1/collections/posts/feed"
					);

					const normalizeXml = (xml: string) => {
						return prettier.format(
							xml
								.replace(
									/http:\/\/127\.0\.0\.1:\d+/g,
									"http://127.0.0.1:PORT"
								) // Normalize port numbers
								.replace(
									/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
									"TIMESTAMP"
								)
								.replace(
									/\/posts\/[a-zA-Z0-9_-]+/g,
									"/posts/ID"
								) // Normalize post IDs in URLs
								.replace(
									/<id>[^<]+<\/id>/g,
									"<id>http://127.0.0.1:PORT/api/v1/colections/posts/ID</id>"
								),
							{ parser: "html" }
						); // Normalize timestamps
					};

					assert.strictEqual(
						await normalizeXml(atom_feed),
						await normalizeXml(
							/* HTML */ `<?xml version="1.0" encoding="utf-8"?>

								<feed xmlns="http://www.w3.org/2005/Atom">
									<title>testing app / posts</title>
									<link
										href="http://127.0.0.1:33255/api/v1/collections/posts/feed"
										rel="self"
									/>
									<id
										>http://127.0.0.1:33255/api/v1/collections/posts/feed</id
									>
									<link href="http://127.0.0.1:33255" />
									<updated>2025-03-09T14:29:57.639Z</updated>

									<entry>
										<title>article 2</title>
										<link
											href="http://127.0.0.1:33255/api/v1/collections/posts/Mh-6kc8F1fPOBb3eWso9Q"
										/>
										<id
											>http://127.0.0.1:33255/api/v1/colections/posts/Mh-6kc8F1fPOBb3eWso9Q</id
										>
										<published
											>2025-03-09T14:29:57.639Z</published
										>
										<updated
											>2025-03-09T14:29:57.639Z</updated
										>
										<content type="xhtml">
											<div
												xmlns="http://www.w3.org/1999/xhtml"
											>
												article 2 content
											</div>
										</content>
										<author>
											<name>Unknown author</name>
										</author>
									</entry>
									<entry>
										<title>article 1</title>
										<link
											href="http://127.0.0.1:33255/api/v1/collections/posts/c40Rq8ahEs3-OgKJecsjg"
										/>
										<id
											>http://127.0.0.1:33255/api/v1/colections/posts/c40Rq8ahEs3-OgKJecsjg</id
										>
										<published
											>2025-03-09T14:29:57.638Z</published
										>
										<updated
											>2025-03-09T14:29:57.638Z</updated
										>
										<content type="xhtml">
											<div
												xmlns="http://www.w3.org/1999/xhtml"
											>
												article 1 content
											</div>
										</content>
										<author>
											<name>Unknown author</name>
										</author>
									</entry>
								</feed>`
						)
					);
				}
			));

		it("lets the user modify the values of the atom feed entries", async () =>
			withRunningApp(
				(t) =>
					class extends t {
						collections = {
							...App.BaseCollections,
							posts: new (class extends Collection {
								readonly fields = {
									title: new FieldTypes.Text(),
									feedTitle: new FieldTypes.Text(),
									content: new FieldTypes.Text(),
								} as const;

								mapFieldsToFeed(): FieldEntryMapping<this> {
									return {
										...super.mapFieldsToFeed(),
										title: async (_ctx, item) =>
											item.get("feedTitle") ||
											item.get("title") ||
											"Untitled",
									};
								}
							})(),
						};
					},

				async ({ app }) => {
					await app.collections.posts.upsert(
						new app.SuperContext(),
						"title",
						[
							{
								title: "article 1",
								content: "article 1 content",
							},
						]
					);
				}
			));

		it("escapes the content of the atom feed html entry", async () =>
			withRunningApp(
				(t) =>
					class extends t {
						collections = {
							...App.BaseCollections,
							posts: new (class extends Collection {
								fields = {
									title: new FieldTypes.Text(),
								} as const;

								mapFieldsToFeed(): FieldEntryMapping<this> {
									return {
										...super.mapFieldsToFeed(),
										content: `<b>STRONG&nbsp;CONTENT</b>`,
									};
								}
							})(),
						};
					},

				async ({ app, rest_api }) => {
					await app.collections.posts.upsert(
						new app.SuperContext(),
						"title",
						[
							{
								title: "article 1",
							},
						]
					);
					const atom_feed = await rest_api.get(
						"/api/v1/collections/posts/feed"
					);
					// both the < and the & need to be escaped
					assert(
						atom_feed.includes(
							"&lt;b>STRONG&amp;nbsp;CONTENT&lt;/b>"
						)
					);
				}
			));
	});
});
