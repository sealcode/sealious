import assert from "assert";
import {
	withStoppedApp,
	MockRestApi,
	withRunningApp,
} from "../../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async";
import { getDateTime } from "../../../utils/get-datetime";
import { App, Context, Collection, FieldTypes, Field } from "../../../main";
import Bluebird from "bluebird";
import { TestAppType } from "../../../test_utils/test-app";
import ItemList from "../../../chip-types/item-list";
import { RefreshCondition } from "./cached-value";
import { EventDescription } from "../../delegate-listener";

const action_to_status: { [name: string]: string } = {
	create: "created",
	open: "open",
	suspend: "suspended",
	close: "closed",
};

const extend = (
	is_status_field_desired: boolean,
	clear_database_on_stop: boolean = true
) => (t: TestAppType) => {
	const account_fields: { [field_name: string]: Field } = {
		username: new FieldTypes.Username(),
		number: new FieldTypes.CachedValue(
			new FieldTypes.Int({
				min: 0,
			}),
			{
				get_value: async (context: Context, resource_id: string) => {
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
				get_value: async (context: Context, resource_id: string) => {
					context.app.Logger.debug3(
						"STATUS FIELD",
						`calculating value for ${resource_id}`
					);
					const {
						items,
					} = await context.app.collections.actions
						.list(new context.app.SuperContext())
						.filter({ account: resource_id })
						.sort({ "_metadata.modified_at": "desc" })
						.paginate({ items: 1 })
						.fetch();
					context.app.Logger.debug3(
						"STATUS FIELD",
						"New cached value is",
						action_to_status[items[0].get("name")]
					);
					return action_to_status[items[0].get("name")];
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
			name: new FieldTypes.Enum(["create", "open", "suspend", "close"]),
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
	async function add_account(rest_api: MockRestApi, account: {}) {
		const { id } = await rest_api.post(
			"/api/v1/collections/accounts",
			account
		);
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
		const account_ids: string[] = [];
		await withStoppedApp(
			extend(false, false),
			async ({ app, rest_api }) => {
				await app.start();
				for (const username of ["user_1", "user_2"]) {
					account_ids.push(await add_account(rest_api, { username }));
				}
				await rest_api.post("/api/v1/collections/actions", {
					name: "suspend",
					account: account_ids[1],
				});
			}
		);

		await withRunningApp(extend(true), async ({ rest_api }) => {
			await assert_status_equals(rest_api, account_ids[0], "created");
			await assert_status_equals(rest_api, account_ids[1], "suspended");
		});
	});

	it("Correctly updates cached-value on create", async () =>
		withRunningApp(extend(true), async ({ rest_api }) => {
			const account_ids = [];
			for (const username of ["user_1", "user_2"]) {
				account_ids.push(await add_account(rest_api, { username }));
			}
			await assert_status_equals(rest_api, account_ids[0], "created");

			const actions = ["open", "suspend", "close"];
			for (let action of actions) {
				await rest_api.post("/api/v1/collections/actions", {
					name: action,
					account: account_ids[0],
				});
				const status = action_to_status[action];
				await assert_status_equals(rest_api, account_ids[0], status);
				await assert_status_equals(rest_api, account_ids[1], "created");
			}
		}));

	it("Correctly updates cached-value on update", async () =>
		withRunningApp(extend(true), async ({ rest_api }) => {
			const account_id = await add_account(rest_api, {
				username: "user_1",
			});

			const {
				items: [{ id: action_id }],
			} = await rest_api.get("/api/v1/collections/actions", {
				account: account_id,
			});

			await rest_api.patch(`/api/v1/collections/actions/${action_id}`, {
				name: "open",
			});

			await assert_status_equals(rest_api, account_id, "open");
		}));

	it("Respects is_proper_value of base field type", async () =>
		withRunningApp(extend(true), async ({ app }) => {
			await assertThrowsAsync(
				async () =>
					app.collections.accounts.suCreate({
						username: "user_2",
						number: -1,
					}),
				(error) => {
					assert.equal(
						error.data.number.message,
						"Value -1 should be larger than or equal to 0"
					);
				}
			);
		}));

	it("Respects filters of base field type", async () =>
		withRunningApp(extend(true), async ({ app, rest_api }) => {
			await add_a_few_accounts(app);

			const { items: accounts } = await rest_api.get(
				"/api/v1/collections/accounts?filter[number][>]=3"
			);

			assert.equal(accounts.length, 2);
		}));

	it("Respects format of base field type", async () =>
		withRunningApp(extend(true), async ({ rest_api }) => {
			const id = await add_account(rest_api, { username: "user_1" });

			const expected_datetime = getDateTime(
				new Date("2018-01-01"),
				"yyyy-mm-dd hh:mm:ss"
			);
			const actual_datetime = ((await rest_api.get(
				`/api/v1/collections/accounts/${id}?format[date_time]=human_readable`
			)) as any).items[0].date_time;

			assert.equal(actual_datetime, expected_datetime);
		}));

	it("Properly responds to recursive edits", async () =>
		withStoppedApp(extend(true), async ({ app, app_class }) => {
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
										const response = await new ItemList(
											app.collections["happy-numbers"],
											context
										)
											.ids([number_id])
											.fetch();
										return (
											response.items[0].get("number") * 2
										);
									},
									refresh_on: [
										{
											event: new EventDescription(
												"happy-numbers",
												"after:create"
											),
											resource_id_getter: async (
												_: any,
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
					})();
					await new_app.start();
				},
				(e) => {
					assert.equal(
						e.message,
						`In the happy-numbers collection definition you've tried to create the double_number cached-value field that refers to the collection itself. Consider using 'derived-value' field type to avoid problems with endless recurrence.`
					);
				}
			);
		}));
});

function make_refresh_on(): RefreshCondition[] {
	return [
		{
			event: new EventDescription("actions", "after:create"),
			resource_id_getter: async (_: any, item) => [
				item.get("account") as string,
			],
		},
		{
			event: new EventDescription("actions", "after:edit"),
			resource_id_getter: async (_: any, resource) => [
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
	)) as any;
	assert.equal(items[0].status, expected_status);
}
