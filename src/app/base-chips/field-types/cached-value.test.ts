/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import assert from "assert";
import type Field from "../../../chip-types/field.js";
import type { ItemListResult } from "../../../chip-types/item-list-result.js";
import {
	App,
	ClockEventDescription,
	Collection,
	CollectionItem,
	CollectionRefreshCondition,
	Context,
	FieldTypes,
	RefreshCondition,
	SuperContext,
} from "../../../main.js";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async.js";
import type MockRestApi from "../../../test_utils/rest-api.js";
import type {
	CollectionResponse,
	ItemCreatedResponse,
	ItemResponse,
} from "../../../test_utils/rest-api.js";
import { sleep } from "../../../test_utils/sleep.js";
import { TestApp } from "../../../test_utils/test-app.js";
import {
	withRunningApp,
	withStoppedApp,
	type TestAppConstructor,
} from "../../../test_utils/with-test-app.js";
import CachedValue from "./cached-value.js";
import Int from "./int.js";

const action_to_status: { [name: string]: string } = {
	create: "created",
	open: "open",
	suspend: "suspended",
	close: "closed",
};

const MIN_VALUE = 0;

const extend =
	(is_status_field_desired: boolean, clear_database_on_stop = true) =>
	(t: TestAppConstructor) => {
		const account_fields: { [field_name: string]: Field<any> } = {
			username: new FieldTypes.Username(),

			number: new FieldTypes.CachedValue(
				new FieldTypes.Int({
					min: MIN_VALUE,
				}),
				{
					get_value: async () => {
						return 0;
					},
					refresh_on: [],
					initial_value: 0,
				}
			),
			date_time: new FieldTypes.CachedValue(new FieldTypes.DateTime(), {
				get_value: async () => new Date("2018-01-01").getTime(),
				refresh_on: make_refresh_on(),
				initial_value: 0,
			}),
		};
		if (is_status_field_desired) {
			account_fields.status = new FieldTypes.CachedValue(
				new FieldTypes.Enum(Object.values(action_to_status)),
				{
					get_value: async (
						context: Context,
						item: CollectionItem
					) => {
						context.app.Logger.debug3(
							"STATUS FIELD",
							`calculating value for ${item.id}`
						);
						const { items } = await context.app.collections
							.actions!.list(new context.app.SuperContext())
							.filter({ account: item.id })
							.sort({ "_metadata.modified_at": "desc" })
							.paginate({ items: 1 })
							.fetch();
						context.app.Logger.debug3(
							"STATUS FIELD",
							"New cached value is",
							action_to_status[
								items[0]!.get(
									"name"
								) as keyof typeof action_to_status
							]
						);
						return action_to_status[
							items[0]!.get(
								"name"
							) as keyof typeof action_to_status
						];
					},
					refresh_on: make_refresh_on(),
					initial_value: "created",
				}
			);
		}
		const accounts = new (class extends Collection {
			name = "accounts";
			fields = {
				...account_fields,
			};
		})();

		const actions = new (class extends Collection {
			name = "actions";
			fields = {
				name: new FieldTypes.Enum([
					"create",
					"open",
					"suspend",
					"close",
				]),
				account: new FieldTypes.SingleReference("accounts"),
			};
		})();

		return class extends t {
			collections = {
				...App.BaseCollections,
				actions,
				accounts,
			};
			clear_database_on_stop = clear_database_on_stop;
		};
	};

describe("cached-value", () => {
	async function add_account(
		rest_api: MockRestApi,
		account: { username: string; number?: number; date_time?: string }
	) {
		const { id } = (await rest_api.post(
			"/api/v1/collections/accounts",
			account
		)) as ItemCreatedResponse;
		await rest_api.post("/api/v1/collections/actions", {
			name: "create",
			account: id,
		});
		return id;
	}

	async function add_a_few_accounts(app: App) {
		return Promise.all(
			[1, 2, 3, 4, 5].map((i) =>
				app.collections.accounts!.suCreate({
					username: `user_${i}`,
					number: i,
				})
			)
		);
	}

	it("Correctly fills in cached-values if such field is added later", async () => {
		let account_ids: string[] = [];
		await withStoppedApp(
			extend(false, false),
			async ({ app, rest_api }) => {
				await app.start();
				account_ids = await Promise.all(
					["user_1", "user_2"].map((username) =>
						add_account(rest_api, { username })
					)
				);

				await rest_api.post("/api/v1/collections/actions", {
					name: "suspend",
					account: account_ids[1],
				});
			},
			"cached-fill"
		);

		await withRunningApp(
			extend(true),
			async ({ rest_api }) => {
				await assert_status_equals(
					rest_api,
					account_ids[0]!,
					"created"
				);
				await assert_status_equals(
					rest_api,
					account_ids[1]!,
					"suspended"
				);
			},
			"cached-fill"
		);
	});

	it("Correctly updates cached-value on create", async () =>
		withRunningApp(extend(true), async ({ rest_api }) => {
			const account_ids = await Promise.all(
				["user_1", "user_2"].map((username) =>
					add_account(rest_api, { username })
				)
			);

			await assert_status_equals(rest_api, account_ids[0]!, "created");

			const actions = ["open", "suspend", "close"];
			for (const action of actions) {
				await rest_api.post("/api/v1/collections/actions", {
					name: action,
					account: account_ids[0],
				});
				const status = action_to_status[action];
				await assert_status_equals(rest_api, account_ids[0]!, status!);
				await assert_status_equals(
					rest_api,
					account_ids[1]!,
					"created"
				);
			}
		}));

	it("Correctly updates cached-value on update", async () =>
		withRunningApp(extend(true), async ({ rest_api }) => {
			const account_id = await add_account(rest_api, {
				username: "user_1",
			});

			const {
				items: [element],
			} = (await rest_api.get(
				"/api/v1/collections/actions",
				{},
				{ account: account_id } // TODO: check if passing the query here works under the new MockRestAPI
			)) as CollectionResponse;

			const { id: action_id } = element!;

			await rest_api.patch(`/api/v1/collections/actions/${action_id}`, {
				name: "open",
			});

			await assert_status_equals(rest_api, account_id, "open");
		}));

	it("Respects is_proper_value of base field type", async () =>
		withRunningApp(extend(true), async ({ app }) => {
			const value = -1;
			await assertThrowsAsync(
				async () =>
					app.collections.accounts.suCreate({
						username: "user_2",
						number: value,
					}),
				(error) => {
					assert.strictEqual(
						//@eslint-ignore
						error.data.field_messages.number.message,
						app.i18n("too_small_integer", [value, MIN_VALUE])
					);
				}
			);
		}));

	it("Respects filters of base field type", async () =>
		withRunningApp(extend(true), async ({ app, rest_api }) => {
			await add_a_few_accounts(app);

			const { items: accounts } = (await rest_api.get(
				"/api/v1/collections/accounts?filter[number][>]=3"
			)) as CollectionResponse;

			assert.strictEqual(accounts.length, 2);
		}));

	it("Properly responds to recursive edits", async () =>
		withStoppedApp(
			extend(true),
			async ({ app, app_class, base_url, uniq_id, env, port }) => {
				await assertThrowsAsync(
					async () => {
						const HappyNumbers = class HappyNumbers extends Collection {
							fields = {
								number: new FieldTypes.Int(),
								double_number: new FieldTypes.CachedValue(
									new FieldTypes.Int(),
									{
										get_value: async (
											context: Context,
											number: CollectionItem
										) => {
											const response =
												// @ts-ignore
												await app.collections[
													"happy-numbers"
												]
													.list(context)
													.ids([number.id])
													.fetch();
											return (
												(response.items[0].get(
													"number"
												) as number) * 2
											);
										},
										refresh_on: [
											new CollectionRefreshCondition(
												"happy-numbers",
												"after:create",
												async ([, item]) => [item.id]
											),
										],
										initial_value: 0,
									}
								),
							};
						};

						const new_app = new (class extends app_class {
							collections = {
								...App.BaseCollections,
								"happy-numbers": new HappyNumbers(),
							};
						})(uniq_id, env, port, base_url);
						await new_app.start();
					},
					(e) => {
						assert.strictEqual(
							e.message,
							`In the happy-numbers collection definition you've tried to create the double_number cached-value field that refers to the collection itself. Consider using 'derived-value' field type to avoid problems with endless recurrence.`
						);
					}
				);
			}
		));

	it("should pass friendship scenario", async () => {
		return withRunningApp(
			(test_app_type) => {
				return class extends test_app_type {
					collections = {
						...TestApp.BaseCollections,
						people: new (class extends Collection {
							fields = {
								name: new FieldTypes.Text(),
								popularity: new FieldTypes.CachedValue(
									new FieldTypes.Int({ min: 0 }),
									{
										refresh_on: [
											new CollectionRefreshCondition(
												"who-likes-who",
												"after:create",
												async ([, item]) => [
													item.get(
														"likes_this_person"
													) as string,
												]
											),
										],
										get_value: async function (
											context,
											item
										) {
											const is_liked_by =
												(await context.app.collections[
													"who-likes-who"
												]!.suList()
													.filter({
														likes_this_person:
															item.id,
													})
													.fetch()) as ItemListResult<any>;
											return is_liked_by.items.length;
										},
										initial_value: 0,
									}
								),
							};
						})(),
						"who-likes-who": new (class extends Collection {
							fields = {
								this_person: new FieldTypes.SingleReference(
									"people"
								),
								likes_this_person:
									new FieldTypes.SingleReference("people"),
							};
						})(),
					};
				};
			},
			async ({ rest_api }) => {
				const alice = await rest_api.post(
					"/api/v1/collections/people",
					{
						name: "alice",
					}
				);
				const bob = await rest_api.post("/api/v1/collections/people", {
					name: "bob",
				});
				const friendship = await rest_api.post(
					"/api/v1/collections/who-likes-who",
					{
						this_person: bob.id as string,
						likes_this_person: alice.id as string,
					}
				);
				const response = await rest_api.get(
					`/api/v1/collections/people/${alice.id as string}`
				);
				assert.strictEqual(response.items[0].popularity, 1);
				await rest_api.delete(
					`/api/v1/collections/who-likes-who/${
						friendship.id as string
					}`
				);
			}
		);
	});

	it("behaves correctly when the initial value is null", () =>
		withRunningApp(
			(test_app) =>
				class extends test_app {
					collections = {
						...App.BaseCollections,
						jobs: new (class extends Collection {
							fields = {
								title: new FieldTypes.Text(),
							};
						})(),
						hasdefault: new (class extends Collection {
							fields = {
								isdefault: new FieldTypes.CachedValue(
									new FieldTypes.SingleReference("jobs"),
									{
										refresh_on: [
											new CollectionRefreshCondition(
												"jobs",
												"after:edit",
												async ([, item]) => [item.id]
											),
										],
										get_value: async function (
											context,
											item
										) {
											const job =
												await context.app.collections[
													"jobs"
												]!.getByID(context, item.id);
											return job.id;
										},
										initial_value: null,
									}
								),
							};
						})(),
					};
				},
			async ({ app }) => {
				const hasdefault = await app.collections.hasdefault.suCreate(
					{}
				);
				assert.strictEqual(hasdefault.get("isdefault"), null);
			}
		));

	it("handles field types that depend on being .inited", () =>
		withRunningApp(
			(test_app) =>
				class extends test_app {
					collections = {
						...App.BaseCollections,
						jobs: new (class extends Collection {
							fields = {
								title: new FieldTypes.Text(),
								hasjob: new FieldTypes.SingleReference(
									"hasjob"
								),
							};
						})(),
						hasjob: new (class extends Collection {
							fields = {
								job: new FieldTypes.CachedValue(
									new FieldTypes.SingleReference("jobs"),
									{
										refresh_on: [
											new CollectionRefreshCondition(
												"jobs",
												"after:create",
												async ([, item]) => [
													item.get(
														"hasjob"
													) as string,
												]
											),
										],
										get_value: async function (
											context,
											item
										) {
											const {
												items: [job],
											} = await context.app.collections
												.jobs!.suList()
												.filter({ hasjob: item.id })
												.fetch();
											return job!.id;
										},
										initial_value: "",
									}
								),
							};
						})(),
					};
				},
			async ({ app }) => {
				const hasjob = await app.collections.hasjob.suCreate({});
				const job = await app.collections.jobs.suCreate({
					title: "any",
					hasjob: hasjob.id,
				});
				const {
					items: [hasjob_after],
				} = await app.collections.hasjob.suList().fetch();
				assert.strictEqual(hasjob_after!.get("job"), job.id);
			}
		));

	it("handles clock-based tasks", () =>
		withStoppedApp(
			(app_class) => {
				const count = (function* () {
					yield 1;
					while (true) {
						yield 2;
					}
				})();
				return class extends app_class {
					collections = {
						...App.BaseCollections,
						tick_tock: new (class TickTock extends Collection {
							fields = {
								seconds: new CachedValue(new Int(), {
									initial_value: 0,
									refresh_on: [
										new ClockEventDescription(
											"* * * * * *",
											async ([context]) => {
												const { items } =
													await context.app.collections
														.tick_tock!.list(
															context
														)
														.fetch();
												return items.map((i) => i.id);
											},
											(app: App) => new app.SuperContext()
										),
									],
									get_value: async (_item) => {
										return count.next().value;
									},
								}),
							};
						})(),
					};
				};
			},
			async (test) => {
				await test.app.start();
				await test.app.collections.tick_tock.suCreate({});
				await sleep(3000);
				const {
					items: [item],
				} = await test.app.collections.tick_tock.suList().fetch();
				assert.strictEqual(item!.get("seconds"), 2);
				await test.app.stop();
			}
		));

	describe("variant with derived_value", () => {
		it("works on a simple scenario", () =>
			withRunningApp(
				(test_app) =>
					class extends test_app {
						collections = {
							...App.BaseCollections,
							comments: new (class extends Collection {
								fields = {
									text: new FieldTypes.Text(),
									product: new FieldTypes.SingleReference(
										"products"
									),
								};
							})(),
							products: new (class extends Collection {
								fields = {
									name: new FieldTypes.Text(),
									price: new FieldTypes.Float(),
									// a product is considered hot if it's cheap or has at least one comment
									is_hot: new FieldTypes.CachedValue(
										new FieldTypes.Boolean(),
										{
											refresh_on: [
												new CollectionRefreshCondition(
													"comments",
													[
														"after:create",
														"after:edit",
														"after:remove",
													],
													async ([, item]) => [
														item.get(
															"product"
														) as string,
													]
												),
											],
											get_value: async (
												context,
												item
											) => {
												const price =
													await item.getDecoded(
														"price",
														context
													);
												const comments_count = (
													await context.app.collections[
														"comments"
													]!.suList()
														.filter({
															product: item.id,
														})
														.fetch()
												).items.length;
												return (
													(price as number) < 100 ||
													comments_count > 0
												);
											},
											initial_value: false,
											derive_from: ["price"],
										}
									),
								};
							})(),
						};
					},
				async ({ app }) => {
					const context = new app.Context();
					let product = await app.collections.products.create(
						context,
						{
							name: "hehe shampoo",
							price: 150,
							is_hot: false,
						}
					);
					assert.strictEqual(
						product.get("is_hot"),
						false,
						"Should be false, because the product is neither cheap nor commented on"
					);
					product.set("price", 90);
					await product.save(context);
					product = await app.collections.products.getByID(
						context,
						product.id
					); // refreshing;
					assert.strictEqual(
						product.get("is_hot"),
						true,
						"Should be true, because the product is cheap"
					);
					product.set("price", 110);
					await product.save(context);
					product = await app.collections.products.getByID(
						context,
						product.id
					); // refreshing;
					assert.strictEqual(
						product.get("is_hot"),
						false,
						"Should be false, because the product is expensive again"
					);
					await app.collections.comments.create(context, {
						text: "good stuff",
						product: product.id,
					});
					product = await app.collections.products.getByID(
						context,
						product.id
					); // refreshing;
					assert.strictEqual(
						product.get("is_hot"),
						true,
						"Should be true, because the product has comments"
					);
				}
			));
	});
});

function make_refresh_on(): RefreshCondition[] {
	return [
		new CollectionRefreshCondition(
			"actions",
			["after:create", "after:edit"],
			async ([, action]) => [action.get("account") as string]
		),
	];
}

async function assert_status_equals(
	rest_api: MockRestApi,
	account_id: string,
	expected_status: string
) {
	const { items } = (await rest_api.get(
		`/api/v1/collections/accounts/${account_id}`
	)) as ItemResponse;
	assert.strictEqual(items[0].status, expected_status);
}
