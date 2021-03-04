/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import assert from "assert";
import { withRunningApp } from "../../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async";
import { App, Collection, Context, FieldTypes, Policies } from "../../../main";
import { TestAppType } from "../../../test_utils/test-app";
import MockRestApi, {
	CollectionResponse,
	ItemCreatedResponse,
} from "../../../test_utils/rest-api";
import { AxiosError, AxiosRequestConfig } from "axios";
import asyncForEach from "../../../utils/async-foreach";
const SSH_KEYS_URL = "/api/v1/collections/ssh-keys";

const sessions: { [username: string]: AxiosRequestConfig } = {};
const ALLOWED_ROLES = ["admin"];
const MIN_TEXT_LENGTH = 3;

type Key = { [access in "_public" | "_private"]: string };

function extend(t: TestAppType) {
	return class extends t {
		collections = {
			...t.BaseCollections,
			"ssh-keys": new (class extends Collection {
				fields = {
					public: new FieldTypes.Text(),
					private: new FieldTypes.ControlAccess(
						new FieldTypes.Text({ min_length: MIN_TEXT_LENGTH }),
						{
							target_policies: {
								show: new Policies.Roles(ALLOWED_ROLES),
								edit: new Policies.Roles(ALLOWED_ROLES),
							},
							value_when_not_allowed: "Forbidden",
						}
					),
				};
				policies = {
					create: new Policies.Roles(ALLOWED_ROLES),
				};
			})(),
		};
	};
}

async function setupUsers(App: App, rest_api: MockRestApi) {
	const password = "it-really-doesnt-matter";
	let admin_id;
	for (const username of ["admin", "regular-user"]) {
		const user = await App.collections.users.suCreate({
			username,
			password,
			email: `${username}@example.com`,
			roles: [],
		});
		if (username == "admin") {
			await App.collections["user-roles"].suCreate({
				role: "admin",
				user: user.id,
			});
		}

		sessions[username] = await rest_api.login({
			username,
			password,
		});
		if (username === "admin") admin_id = user.id;
	}

	await rest_api.post(
		"/api/v1/collections/user-roles",
		{
			user: admin_id,
			role: "admin",
		},
		sessions.admin
	);
}

async function fillKeysCollections(App: App) {
	const keys: Key[] = [
		{
			_public: "a-public-key",
			_private: "seeeeecret",
		},
		{
			_public: "go-get-it",
			_private: "you-cannot-see",
		},
	];
	await asyncForEach(keys, async ({ _public, _private }) => {
		await App.collections["ssh-keys"].suCreate({
			public: _public,
			private: _private,
		});
	});
}

async function setup(app: App, rest_api: MockRestApi) {
	await fillKeysCollections(app);
	await setupUsers(app, rest_api);
}

describe("control-access", () => {
	it("Hides a protected value from regular-user", async () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			await setup(app, rest_api);

			const { items: ssh_keys } = (await rest_api.get(
				SSH_KEYS_URL,
				sessions["regular-user"]
			)) as CollectionResponse;

			ssh_keys.forEach((key) => {
				assert.deepStrictEqual(key.private, "Forbidden");
			});
		}));

	it("Uncovers a protected value for admin", async () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			await setup(app, rest_api);

			const { items: ssh_keys } = (await rest_api.get(
				SSH_KEYS_URL,
				sessions.admin
			)) as CollectionResponse;

			ssh_keys.forEach((key) => {
				assert((key.private as string).length >= 3);
			});
		}));

	it("Respects given field type constraints", async () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			const too_short_text = "XD";
			await setup(app, rest_api);

			await assertThrowsAsync(
				() =>
					rest_api.post(
						SSH_KEYS_URL,
						{
							public: "XDDDDDDDDDDDD",
							private: too_short_text,
						},
						sessions.admin
					),
				(e: AxiosError) =>
					assert.strictEqual(
						e?.response?.data?.data?.private?.message,
						app.i18n("too_short_text", [
							too_short_text,
							MIN_TEXT_LENGTH,
						])
					)
			);
		}));

	it("Allows admin to update a protected field", async () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			await setup(app, rest_api);

			const key = (await rest_api.post(
				SSH_KEYS_URL,
				{
					public: "123123",
					private: "321321",
				},
				sessions.admin
			)) as ItemCreatedResponse;

			const {
				items: [updated_key],
			} = (await rest_api.patch(
				`${SSH_KEYS_URL}/${key.id}`,
				{
					private: "654321",
				},
				sessions.admin
			)) as CollectionResponse;

			assert.deepStrictEqual(updated_key.private, "654321");
		}));

	it("Doesn't allow regular-user to update a protected field", async () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			await setup(app, rest_api);

			const key = (await rest_api.post(
				SSH_KEYS_URL,
				{
					public: "123123",
					private: "321321",
				},
				sessions.admin
			)) as ItemCreatedResponse;

			await assertThrowsAsync(
				() =>
					rest_api.patch(
						`${SSH_KEYS_URL}/${key.id}`,
						{ private: "331c6883dd6010864b7ead130be77cd5" },
						sessions["regular-user"]
					),
				(e) =>
					assert.strictEqual(
						e.response.data.data.private.message,
						app.i18n("policy_roles_deny", [ALLOWED_ROLES])
					)
			);
		}));

	it("Honors the default value of the field", async () => {
		withRunningApp(
			(test_app) =>
				class extends test_app {
					collections = {
						...App.BaseCollections,
						tasks: new (class extends Collection {
							fields = {
								title: new FieldTypes.Text(),
								done: new FieldTypes.ControlAccess(
									new (class extends FieldTypes.Boolean {
										hasDefaultValue = () => true;
										async getDefaultValue() {
											return false;
										}
									})(),
									{
										target_policies: {
											show: new Policies.Public(),
											edit: new Policies.Super(),
										},
										value_when_not_allowed: null,
									}
								),
							};

							defaultPolicy = new Policies.Public();
						})(),
					};
				},
			async ({ app }) => {
				const task = await app.collections.tasks.create(
					new Context(app, new Date().getTime(), null, null),
					{ title: "" }
				);
				assert.strictEqual(task.get("done"), false);
			}
		);
	});
});
