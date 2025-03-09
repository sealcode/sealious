import { hasShape, predicates } from "@sealcode/ts-predicates";
import assert from "assert";
import Int from "../app/base-chips/field-types/int.js";
import { App, Context, FieldTypes, Policies } from "../main.js";
import { assertThrowsAsync } from "../test_utils/assert-throws-async.js";
import type { TestApp } from "../test_utils/test-app.js";
import {
	type TestAppConstructor,
	withRunningApp,
} from "../test_utils/with-test-app.js";
import Collection from "./collection.js";

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
			assert.ok(response.items[0].id);
			assert.strictEqual(response.items[0].value, 2);
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

					const guestContext = new Context(
						app,
						new Date().getTime(),
						guest.id
					);
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

				const guestContext = new Context(
					app,
					new Date().getTime(),
					guest.id
				);
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
							guestContext.app.i18n("policy_owner_deny")
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
						patrons[0].get("email"),
						"adam@example.com"
					);
					assert.strictEqual(
						patrons[0].get("end_date"),
						"2024-12-24"
					);
					assert.strictEqual(
						patrons[1].get("email"),
						"eve@example.com"
					);
					assert.strictEqual(patrons[1].get("amount_monthly"), 7);
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
});
