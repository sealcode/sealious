const assert = require("assert");
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const { with_running_app } = locreq("test_utils/with-test-app.js");
const assert_throws_async = locreq("test_utils/assert_throws_async.js");
const { getDateTime } = locreq("lib/utils/get-datetime.js");

const action_to_status = {
	create: "created",
	open: "open",
	suspend: "suspended",
	close: "closed",
};

describe("cached-value", () => {
	async function create_collections(app) {
		app.createChip(app.Sealious.Collection, {
			name: "accounts",
			fields: [
				{
					name: "username",
					type: "username",
					required: true,
				},
				{
					name: "status",
					type: "cached-value",
					params: {
						base_field_type: {
							name: "enum",
							params: {
								values: Object.values(action_to_status),
							},
						},
						get_value: async resource_id => {
							const [
								latest_action,
							] = await app.Datastore.aggregate("actions", [
								{
									$match: {
										"body.account": resource_id,
									},
								},
								{
									$group: {
										_id: "$body.name",
										timestamp: {
											$max:
												"$last_modified_context.timestamp",
										},
									},
								},
							]);

							return action_to_status[latest_action._id];
						},
						refresh_on: make_refresh_on(),
					},
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
						get_value: async resource_id => {
							return app.run_action(
								new app.Sealious.SuperContext(),
								["collections", "accounts", resource_id],
								"show"
							);
						},
						refresh_on: {},
					},
				},
				{
					name: "date_time",
					type: "cached-value",
					params: {
						base_field_type: { name: "datetime" },
						get_value: () => new Date("2018-01-01").getTime(),
						refresh_on: make_refresh_on(),
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
	}

	async function add_account(rest_api, account) {
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

	async function add_a_few_accounts(app) {
		return Promise.map([1, 2, 3, 4, 5], async i =>
			app.run_action(
				app.Sealious.SuperContext(),
				["collections", "accounts"],
				"create",
				{ username: `user_${i}`, number: i }
			)
		);
	}

	it("Correctly updates cached-value on create", async () =>
		with_running_app(async ({ app, rest_api }) => {
			await create_collections(app);
			const account_ids = [];
			for (username of ["user_1", "user_2"]) {
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
			await create_collections(app);
			const account_id = await add_account(rest_api, {
				username: "user_1",
			});

			const action_id = (await rest_api.get(
				"/api/v1/collections/actions",
				{
					account: account_id,
				}
			))[0].id;

			await rest_api.patch(`/api/v1/collections/actions/${action_id}`, {
				name: "open",
			});

			await assert_status_equals(rest_api, account_id, "open");
		}));

	it("Respects is_proper_value of base field type", async () =>
		with_running_app(async ({ app, rest_api }) => {
			await create_collections(app);
			await assert_throws_async(
				() =>
					app.run_action(
						app.Sealious.SuperContext(),
						["collections", "accounts"],
						"create",
						{ username: "user_2", number: -1 }
					),
				error => {
					assert.equal(
						error.data.number.message,
						"Value should be larger or equal to '0."
					);
				}
			);
		}));

	it("Respects filters of base field type", async () =>
		with_running_app(async ({ app }) => {
			await create_collections(app);
			const ids = await add_a_few_accounts(app);

			const accounts = await app.run_action(
				app.Sealious.SuperContext(),
				["collections", "accounts"],
				"show",
				{ filter: { number: { ">": 3 } } }
			);

			assert.equal(accounts.length, 2);
		}));

	it("Respects format of base field type", async () =>
		with_running_app(async ({ app, rest_api }) => {
			await create_collections(app);
			const id = await add_account(rest_api, { username: "user_1" });

			const expected_datetime = getDateTime(
				new Date("2018-01-01"),
				"yyyy-mm-dd hh:mm:ss"
			);
			const actual_datetime = (await rest_api.get(
				`/api/v1/collections/accounts/${id}?format[date_time]=human_readable`
			)).body.date_time;
			assert.equal(actual_datetime, expected_datetime);
		}));
});

function make_refresh_on() {
	return {
		"post:actions:create": async (path, event_params, resource) => {
			return resource.body.account;
		},
		"post:actions\\..*:edit": async (path, event_params, resource) => {
			return resource.body.account;
		},
	};
}

async function assert_status_equals(rest_api, account_id, expected_status) {
	const account = (await rest_api.get(
		`/api/v1/collections/accounts/${account_id}`
	)).body;
	assert.equal(account.status, expected_status);
}
