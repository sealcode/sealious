import assert from "assert";
import {
	with_running_app,
	with_stopped_app,
	MockRestApi,
} from "../../../../test_utils/with-test-app.js";
import assert_throws_async from "../../../../test_utils/assert_throws_async.js";
import { getDateTime } from "../../../utils/get-datetime.js";
import {
	App,
	Context,
	SuperContext,
	Item,
	SingleItemResponse,
} from "../../../main.js";
import Bluebird from "bluebird";

const action_to_status: { [name: string]: string } = {
	create: "created",
	open: "open",
	suspend: "suspended",
	close: "closed",
};

describe("cached-value", () => {
	function create_collections(app: App, is_status_field_desired = true) {
		app.createChip(app.Sealious.Collection, {
			name: "accounts",
			fields: [
				{
					name: "username",
					type: "username",
					required: true,
				},
				{
					name: "number",
					type: "cached-value",
					params: {
						base_field_type: {
							name: "int",
							params: {
								min: 0,
							},
						},
						get_value: async (_: Context, resource_id: string) => {
							return app.run_action(
								new app.Sealious.SuperContext(),
								["collections", "accounts", resource_id],
								"show"
							);
						},
						refresh_on: [],
					},
				},
				{
					name: "date_time",
					type: "cached-value",
					params: {
						base_field_type: { name: "datetime" },
						get_value: () => new Date("2018-01-01").getTime(),
						refresh_on: make_refresh_on(app),
					},
				},
			],
		});
		app.createChip(app.Sealious.Collection, {
			name: "actions",
			fields: [
				{
					name: "name",
					type: "enum",
					params: {
						values: ["create", "open", "suspend", "close"],
					},
					required: true,
				},
				{
					name: "account",
					type: "single_reference",
					params: { collection: "accounts" },
				},
			],
		});
		if (is_status_field_desired) {
			create_status_field(app);
		}
	}

	function create_status_field(app: App) {
		const collection = app.ChipManager.getChip("collection", "accounts");
		collection.add_field({
			name: "status",
			type: "cached-value",
			params: {
				base_field_type: {
					name: "enum",
					params: {
						values: Object.values(action_to_status),
					},
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
			},
		});
	}

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
			app.run_action(
				new SuperContext(),
				["collections", "accounts"],
				"create",
				{ username: `user_${i}`, number: i }
			)
		);
	}

	it("Correctly fills in cached-values if such field is added later", async () => {
		const account_ids: string[] = [];
		await with_stopped_app(
			async ({ app, dont_clear_database_on_stop, rest_api }) => {
				create_collections(app, "create_status_field" && false);
				await app.start();
				for (const username of ["user_1", "user_2"]) {
					account_ids.push(await add_account(rest_api, { username }));
				}
				await rest_api.post("/api/v1/collections/actions", {
					name: "suspend",
					account: account_ids[1],
				});

				dont_clear_database_on_stop();
			}
		);

		await with_stopped_app(async ({ app, rest_api }) => {
			create_collections(app);
			await app.start();
			await assert_status_equals(rest_api, account_ids[0], "created");
			await assert_status_equals(rest_api, account_ids[1], "suspended");
		});
	});

	it("Correctly updates cached-value on create", async () =>
		with_running_app(async ({ app, rest_api }) => {
			create_collections(app);
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
		with_running_app(async ({ app, rest_api }) => {
			create_collections(app);
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
		with_running_app(async ({ app }) => {
			create_collections(app);
			await assert_throws_async(
				() =>
					app.run_action(
						new SuperContext(),
						["collections", "accounts"],
						"create",
						{ username: "user_2", number: -1 }
					),
				(error) => {
					assert.equal(
						error.data.number.message,
						"Value should be larger or equal to '0'."
					);
				}
			);
		}));

	it("Respects filters of base field type", async () =>
		with_running_app(async ({ app, rest_api }) => {
			create_collections(app);
			await add_a_few_accounts(app);

			const { items: accounts } = await rest_api.get(
				"/api/v1/collections/accounts?filter[number][>]=3"
			);

			assert.equal(accounts.length, 2);
		}));

	it("Respects format of base field type", async () =>
		with_running_app(async ({ app, rest_api }) => {
			create_collections(app);
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
		with_running_app(async ({ app }) => {
			await assert_throws_async(
				async () => {
					app.createChip(app.Sealious.Collection, {
						name: "happy-numbers",
						fields: [
							{
								name: "number",
								type: "int",
								required: true,
							},
							{
								name: "double_number",
								type: "cached-value",
								params: {
									base_field_type: { name: "int" },
									get_value: async (
										context: Context,
										number_id: string
									) => {
										const sealious_response = await app.run_action(
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
											resource_id_getter: (
												_: any,
												resource: Item
											) => resource.id,
										},
									],
								},
							},
						],
					});
				},
				(error) =>
					assert.equal(
						error,
						`Error: In the happy-numbers collection definition you've tried to create the double_number cached-value field that refers to the collection itself. Consider using 'derived-value' field type to avoid problems with endless recurrence.`
					)
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
	assert.equal(response.status, expected_status);
}
