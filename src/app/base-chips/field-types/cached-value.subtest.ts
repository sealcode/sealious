import assert from "assert";
import { withStoppedApp, MockRestApi } from "../../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async";
import { getDateTime } from "../../../utils/get-datetime";
import {
	App,
	Context,
	Item,
	SingleItemResponse,
	Collection,
	FieldTypes,
	FieldDefinitionHelper as field,
} from "../../../main";
import Bluebird from "bluebird";

const action_to_status: { [name: string]: string } = {
	create: "created",
	open: "open",
	suspend: "suspended",
	close: "closed",
};

describe("cached-value", () => {
	function createCollections(app: App, is_status_field_desired = true) {
		Collection.fromDefinition(app, {
			name: "accounts",
			fields: [
				field("username", FieldTypes.Username, {}, true),
				field("number", FieldTypes.CachedValue, {
					base_field_type: FieldTypes.Int,
					base_field_params: {
						min: 0,
					},
					get_value: async (_: Context, resource_id: string) => {
						return app.runAction(
							new app.SuperContext(),
							["collections", "accounts", resource_id],
							"show"
						);
					},
					refresh_on: [],
				}),
				field("date_time", FieldTypes.CachedValue, {
					base_field_type: FieldTypes.DateTime,
					get_value: async () => new Date("2018-01-01").getTime(),
					refresh_on: make_refresh_on(app),
				}),
			],
		});
		Collection.fromDefinition(app, {
			name: "actions",
			fields: [
				field(
					"name",
					FieldTypes.Enum,
					{
						values: ["create", "open", "suspend", "close"],
					},
					true
				),
				field("account", FieldTypes.SingleReference, {
					target_collection: () => app.collections.accounts,
				}),
			],
		});
		if (is_status_field_desired) {
			create_status_field(app);
		}
	}

	function create_status_field(app: App) {
		const collection = app.collections.accounts;
		collection.addField(
			field("status", FieldTypes.CachedValue, {
				base_field_type: FieldTypes.Enum,
				base_field_params: {
					values: Object.values(action_to_status),
				},
				get_value: async (_: Context, resource_id: string) => {
					const [latest_action] = await app.Datastore.aggregate(
						"actions",
						[
							{
								$match: {
									account: resource_id,
								},
							},
							{
								$group: {
									_id: "$name",
									timestamp: {
										$max:
											"$_metadata.last_modified_context.timestamp",
									},
								},
							},
						]
					);

					return action_to_status[latest_action._id];
				},
				refresh_on: make_refresh_on(app),
			})
		);
	}

	async function add_account(rest_api: MockRestApi, account: {}) {
		const { id } = await rest_api.post(
			"/api/v1/collections/accounts",
			account
		);
		console.log("@@@@@ CREATING A NEW ACTION FOR THE NEWLY CREATED USER");
		await rest_api.post("/api/v1/collections/actions", {
			name: "create",
			account: id,
		});
		return id;
	}

	async function add_a_few_accounts(app: App) {
		return Bluebird.map([1, 2, 3, 4, 5], async (i) =>
			app.runAction(
				new app.SuperContext(),
				["collections", "accounts"],
				"create",
				{ username: `user_${i}`, number: i }
			)
		);
	}

	it("Correctly fills in cached-values if such field is added later", async () => {
		const account_ids: string[] = [];
		await withStoppedApp(
			async ({ app, dontClearDatabaseOnStop, rest_api }) => {
				createCollections(app, "create_status_field" && false);
				await app.start();
				for (const username of ["user_1", "user_2"]) {
					account_ids.push(await add_account(rest_api, { username }));
				}
				await rest_api.post("/api/v1/collections/actions", {
					name: "suspend",
					account: account_ids[1],
				});

				dontClearDatabaseOnStop();
			}
		);

		await withStoppedApp(async ({ app, rest_api }) => {
			createCollections(app);
			await app.start();
			await assert_status_equals(rest_api, account_ids[0], "created");
			await assert_status_equals(rest_api, account_ids[1], "suspended");
		});
	});

	it("Correctly updates cached-value on create", async () =>
		withStoppedApp(async ({ app, rest_api }) => {
			createCollections(app);
			await app.start();
			const account_ids = [];
			for (const username of ["user_1", "user_2"]) {
				console.log("@@@@@@ ADDING ACCOUNT");
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
		withStoppedApp(async ({ app, rest_api }) => {
			createCollections(app);
			await app.start();
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
		withStoppedApp(async ({ app }) => {
			createCollections(app);
			await app.start();
			await assertThrowsAsync(
				() =>
					app.runAction(
						new app.SuperContext(),
						["collections", "accounts"],
						"create",
						{ username: "user_2", number: -1 }
					),
				(error) => {
					assert.equal(
						error.data.number.message,
						"Value -1 should be larger than or equal to 0"
					);
				}
			);
		}));

	it("Respects filters of base field type", async () =>
		withStoppedApp(async ({ app, rest_api }) => {
			createCollections(app);
			await app.start();
			await add_a_few_accounts(app);

			const { items: accounts } = await rest_api.get(
				"/api/v1/collections/accounts?filter[number][>]=3"
			);

			assert.equal(accounts.length, 2);
		}));

	it("Respects format of base field type", async () =>
		withStoppedApp(async ({ app, rest_api }) => {
			createCollections(app);
			await app.start();
			const id = await add_account(rest_api, { username: "user_1" });

			const expected_datetime = getDateTime(
				new Date("2018-01-01"),
				"yyyy-mm-dd hh:mm:ss"
			);
			const actual_datetime = ((await rest_api.getSealiousResponse(
				`/api/v1/collections/accounts/${id}?format[date_time]=human_readable`
			)) as any).date_time;

			assert.equal(actual_datetime, expected_datetime);
		}));

	it("Properly responds to recursive edits", async () =>
		withStoppedApp(async ({ app }) => {
			await assertThrowsAsync(
				async () => {
					Collection.fromDefinition(app, {
						name: "happy-numbers",
						fields: [
							field("number", FieldTypes.Int, {}, true),
							field("double_number", FieldTypes.CachedValue, {
								base_field_type: FieldTypes.Int,
								get_value: async (
									context: Context,
									number_id: string
								) => {
									const sealious_response = await app.runAction(
										context,
										[
											"collections",
											"happy-numbers",
											number_id,
										],
										"show"
									);
									return sealious_response.number * 2;
								},
								refresh_on: [
									{
										event_matcher: new app.Sealious.EventMatchers.Collection(
											{
												when: "after",
												collection_name:
													"happy-numbers",
												action: "create",
											}
										),
										resource_id_getter: async (
											_: any,
											resource: Item
										) => resource.id,
									},
								],
							}),
						],
					});
					await app.start();
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

function make_refresh_on(app: App) {
	return [
		{
			event_matcher: new app.Sealious.EventMatchers.Collection({
				when: "after",
				collection_name: "actions",
				action: "create",
			}),
			resource_id_getter: (_: any, resource: Item) => resource.account,
		},
		{
			event_matcher: new app.Sealious.EventMatchers.Resource({
				when: "after",
				collection_name: "actions",
				action: "edit",
			}),
			resource_id_getter: (_: any, resource: Item) => resource.account,
		},
	];
}

async function assert_status_equals(
	rest_api: MockRestApi,
	account_id: string,
	expected_status: string
) {
	const response = (await rest_api.getSealiousResponse(
		`/api/v1/collections/accounts/${account_id}`
	)) as SingleItemResponse;
	console.log(response);
	assert.equal(response.status, expected_status);
}
