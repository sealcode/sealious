/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import assert from "assert";
import {
	withStoppedApp,
	withRunningApp,
	TestAppConstructor,
} from "../../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async";
import { getDateTime } from "../../../utils/get-datetime";
import { App, Context, Collection, FieldTypes, Field } from "../../../main";
import Bluebird from "bluebird";
import type { ItemListResult } from "../../../chip-types/item-list";
import type { RefreshCondition } from "./cached-value";
import { EventDescription } from "../../event-description";
import type MockRestApi from "../../../test_utils/rest-api";
import type {
	CollectionResponse,
	ItemCreatedResponse,
	ItemResponse,
} from "../../../test_utils/rest-api";
import { TestApp } from "../../../test_utils/test-app";

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
		const account_fields: { [field_name: string]: Field } = {
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
						resource_id: string
					) => {
						context.app.Logger.debug3(
							"STATUS FIELD",
							`calculating value for ${resource_id}`
						);
						const { items } = await context.app.collections.actions
							.list(new context.app.SuperContext())
							.filter({ account: resource_id })
							.sort({ "_metadata.modified_at": "desc" })
							.paginate({ items: 1 })
							.fetch();
						context.app.Logger.debug3(
							"STATUS FIELD",
							"New cached value is",
							action_to_status[
								items[0].get(
									"name"
								) as keyof typeof action_to_status
							]
						);
						return action_to_status[
							items[0].get(
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
		return Bluebird.map([1, 2, 3, 4, 5], async (i) =>
			app.collections.accounts.suCreate({
				username: `user_${i}`,
				number: i,
			})
		);
	}

	it("Correctly fills in cached-values if such field is added later", async () => {
		let account_ids: string[] = [];
		await withStoppedApp(
			extend(false, false),
			async ({ app, rest_api }) => {
				await app.start();
				account_ids = await Bluebird.map(
					["user_1", "user_2"],
					(username) => add_account(rest_api, { username })
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
				await assert_status_equals(rest_api, account_ids[0], "created");
				await assert_status_equals(
					rest_api,
					account_ids[1],
					"suspended"
				);
			},
			"cached-fill"
		);
	});

	it("Correctly updates cached-value on create", async () =>
		withRunningApp(extend(true), async ({ rest_api }) => {
			const account_ids = await Bluebird.map(
				["user_1", "user_2"],
				(username) => add_account(rest_api, { username })
			);
			await assert_status_equals(rest_api, account_ids[0], "created");

			const actions = ["open", "suspend", "close"];
			await Bluebird.each(actions, async (action) => {
				await rest_api.post("/api/v1/collections/actions", {
					name: action,
					account: account_ids[0],
				});
				const status = action_to_status[action];
				await assert_status_equals(rest_api, account_ids[0], status);
				await assert_status_equals(rest_api, account_ids[1], "created");
			});
		}));

	it("Correctly updates cached-value on update", async () =>
		withRunningApp(extend(true), async ({ rest_api }) => {
			const account_id = await add_account(rest_api, {
				username: "user_1",
			});

			const {
				items: [{ id: action_id }],
			} = (await rest_api.get("/api/v1/collections/actions", {
				data: { account: account_id }, // TODO: check if passing the query here works under the new MockRestAPI
			})) as CollectionResponse;

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

	it("Respects format of base field type", async () =>
		withRunningApp(extend(true), async ({ rest_api }) => {
			const id = await add_account(rest_api, { username: "user_1" });

			const expected_datetime = getDateTime(
				new Date("2018-01-01"),
				"yyyy-mm-dd hh:mm:ss"
			);
			const actual_datetime = (
				(await rest_api.get(
					`/api/v1/collections/accounts/${id}?format[date_time]=human_readable`
				)) as CollectionResponse
			).items[0].date_time as string;

			assert.strictEqual(actual_datetime, expected_datetime);
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
											number_id: string
										) => {
											const response =
												// @ts-ignore
												await app.collections[
													"happy-numbers"
												]
													.list(context)
													.ids([number_id])
													.fetch();
											return (
												(response.items[0].get(
													"number"
												) as number) * 2
											);
										},
										refresh_on: [
											{
												event: new EventDescription(
													"happy-numbers",
													"after:create"
												),
												resource_id_getter: async (
													_,
													item
												) => [item.id],
											},
										],
										initial_value: 0,
									}
								),
							};
						};

						const new_app = new (class extends app_class {
							collections = {
								...super.collections,
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
											{
												event: new EventDescription(
													"who-likes-who",
													"after:create"
												),
												resource_id_getter: async (
													_,
													item
												) => [
													item.get(
														"likes_this_person"
													) as string,
												],
											},
										],
										get_value: async function (
											context,
											item_id
										) {
											const is_liked_by =
												(await context.app.collections[
													"who-likes-who"
												]
													.suList()
													.filter({
														likes_this_person:
															item_id,
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
					`/api/v1/collections/people/${alice.id}`
				);
				assert.strictEqual(response.items[0].popularity, 1);
				await rest_api.delete(
					`/api/v1/collections/who-likes-who/${friendship.id}`
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
											{
												event: new EventDescription(
													"jobs",
													"after:edit"
												),
												resource_id_getter: async (
													_,
													item
												) => [item.id],
											},
										],
										get_value: async function (
											context,
											item_id
										) {
											const job =
												await context.app.collections[
													"jobs"
												].getByID(context, item_id);
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
											{
												event: new EventDescription(
													"jobs",
													"after:create"
												),
												resource_id_getter: async (
													_,
													item
												) => [item.get("hasjob")],
											},
										],
										get_value: async function (
											context,
											item_id
										) {
											const {
												items: [job],
											} = await context.app.collections.jobs
												.suList()
												.filter({ hasjob: item_id })
												.fetch();
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
				const hasjob = await app.collections.hasjob.suCreate({});
				const job = await app.collections.jobs.suCreate({
					title: "any",
					hasjob: hasjob.id,
				});
				const {
					items: [hasjob_after],
				} = await app.collections.hasjob.suList().fetch();
				assert.strictEqual(hasjob_after.get("job"), job.id);
			}
		));
});

function make_refresh_on(): RefreshCondition[] {
	return [
		{
			event: new EventDescription("actions", "after:create"),
			resource_id_getter: async (_, item) => [
				item.get("account") as string,
			],
		},
		{
			event: new EventDescription("actions", "after:edit"),
			resource_id_getter: async (_, resource) => [
				resource.get("account") as string,
			],
		},
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
