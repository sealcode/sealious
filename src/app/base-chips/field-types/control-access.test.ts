/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import assert from "assert";
import {
	type TestAppConstructor,
	withRunningApp,
} from "../../../test_utils/with-test-app.js";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async.js";
import {
	App,
	Collection,
	Context,
	FieldTypes,
	Policies,
} from "../../../main.js";
import type MockRestApi from "../../../test_utils/rest-api.js";
import type {
	CollectionResponse,
	ItemCreatedResponse,
	RestAPIError,
} from "../../../test_utils/rest-api.js";
import asyncForEach from "../../../utils/async-foreach.js";
import { TestApp } from "../../../test_utils/test-app.js";
const SSH_KEYS_URL = "/api/v1/collections/ssh-keys";

const username = "regular-user";
const MIN_TEXT_LENGTH = 3;

let session: Parameters<typeof fetch>[1];

type Key = { [access in "_public" | "_private"]: string };

function extend(t: TestAppConstructor) {
	return class extends t {
		collections = {
			...TestApp.BaseCollections,
			"ssh-keys": new (class extends Collection {
				fields = {
					public: new FieldTypes.Text(),
					private: new FieldTypes.ControlAccess(
						new FieldTypes.Text({ min_length: MIN_TEXT_LENGTH }),
						{
							target_policies: {
								show: new Policies.LoggedIn(),
								edit: new Policies.LoggedIn(),
							},
							value_when_not_allowed: "Forbidden",
						}
					),
				};
				policies = {
					create: new Policies.LoggedIn(),
				};
			})(),
		};
	};
}

async function setupUsers(App: App, rest_api: MockRestApi) {
	const password = "it-really-doesnt-matter";
	await App.collections.users.suCreate({
		username,
		password,
	});

	session = await rest_api.login({
		username,
		password,
	});
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
		await App.collections["ssh-keys"]!.suCreate({
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
	it("Hides a protected value from not-logged", async () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			await setup(app, rest_api);

			const { items: ssh_keys } = (await rest_api.get(
				SSH_KEYS_URL
			)) as CollectionResponse;

			ssh_keys.forEach((key) => {
				assert.deepStrictEqual(key.private, "Forbidden");
			});
		}));

	it("Uncovers a protected value for logged", async () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			await setup(app, rest_api);

			const { items: ssh_keys } = (await rest_api.get(
				SSH_KEYS_URL,
				session
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
						session
					),
				(e: RestAPIError) =>
					assert.strictEqual(
						e?.response?.data?.data?.field_messages?.private
							?.message,
						app.i18n("too_short_text", [
							too_short_text,
							MIN_TEXT_LENGTH,
						])
					)
			);
		}));

	it("Allows logged to update a protected field", async () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			await setup(app, rest_api);

			const key = (await rest_api.post(
				SSH_KEYS_URL,
				{
					public: "123123",
					private: "321321",
				},
				session
			)) as ItemCreatedResponse;

			const {
				items: [updated_key],
			} = (await rest_api.patch(
				`${SSH_KEYS_URL}/${key.id}`,
				{
					private: "654321",
				},
				session
			)) as CollectionResponse;

			assert.deepStrictEqual(updated_key!.private, "654321");
		}));

	it("Doesn't allow not logged to update a protected field", async () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			await setup(app, rest_api);

			const key = (await rest_api.post(
				SSH_KEYS_URL,
				{
					public: "123123",
					private: "321321",
				},
				session
			)) as ItemCreatedResponse;

			await assertThrowsAsync(
				() =>
					rest_api.patch(`${SSH_KEYS_URL}/${key.id}`, {
						private: "331c6883dd6010864b7ead130be77cd5",
					}),
				(e) =>
					assert.strictEqual(
						e.response.data.data.field_messages.private.message,
						app.i18n("policy_logged_in_deny")
					)
			);
		}));

	it("Honors the default value of the field", async () =>
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
					new app.Context(),
					{ title: "" }
				);
				assert.strictEqual(task.get("done"), false);
			}
		));
});
