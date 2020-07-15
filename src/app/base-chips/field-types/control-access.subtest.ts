import assert from "assert";
import { withRunningApp, MockRestApi } from "../../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async";
import {
	App,
	Collection,
	FieldTypes,
	Policies,
	FieldDefinitionHelper as field,
} from "../../../main";
import { CollectionResponse } from "../../../../common_lib/response/responses";
const SSH_KEYS_URL = "/api/v1/collections/ssh-keys";

type Key = { [access in "_public" | "_private"]: string };

describe("control-access", () => {
	let sessions: { [username: string]: {}[] } = {};
	async function createSshKeysCollections(app: App) {
		Collection.fromDefinition(app, {
			name: "ssh-keys",
			fields: [
				field("public", FieldTypes.Text, {}, true),
				field(
					"private",
					FieldTypes.ControlAccess,
					{
						target_policies: {
							show: new Policies.Roles(["admin"]),
							edit: new Policies.Roles(["admin"]),
						},
						value_when_not_allowed: "Forbidden",
						base_field_type: FieldTypes.Text,
						base_field_params: {
							min_length: 3,
						},
					},
					true
				),
			],
			policy: {
				default: Policies.Public,
				create: [Policies.Roles, ["admin"]],
			},
		});
	}

	async function setupUsers(App: App, rest_api: MockRestApi) {
		const password = "it-really-doesnt-matter";
		let admin_id;
		for (let username of ["admin", "regular-user"]) {
			const user = await App.runAction(
				new App.SuperContext(),
				["collections", "users"],
				"create",
				{
					username,
					password,
					email: `${username}@example.com`,
				}
			);
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
		for (let { _public, _private } of keys) {
			await App.runAction(
				new App.SuperContext(),
				["collections", "ssh-keys"],
				"create",
				{
					public: _public,
					private: _private,
				}
			);
		}
	}

	async function setup(app: App, rest_api: MockRestApi) {
		await createSshKeysCollections(app);
		await fillKeysCollections(app);
		await setupUsers(app, rest_api);
	}

	it("Hides a protected value from regular-user", async () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app, rest_api);

			const { items: ssh_keys } = (await rest_api.get(
				SSH_KEYS_URL,
				sessions["regular-user"]
			)) as CollectionResponse;

			ssh_keys.forEach((key) => {
				assert.deepEqual(key.private, "Forbidden");
			});
		}));

	it("Uncovers a protected value for admin", async () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app, rest_api);

			const { items: ssh_keys } = (await rest_api.get(
				SSH_KEYS_URL,
				sessions.admin
			)) as CollectionResponse;

			ssh_keys.forEach((key) => {
				assert(key.private.length >= 3);
			});
		}));

	it("Respects given field type constraints", async () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app, rest_api);

			await assertThrowsAsync(
				() =>
					rest_api.post(
						SSH_KEYS_URL,
						{
							public: "XDDDDDDDDDDDD",
							private: "XD",
						},
						sessions.admin
					),
				(e) =>
					assert.equal(
						e.response.data.data.private.message,
						"Text 'XD' is too short, minimum length is 3 chars."
					)
			);
		}));

	it("Allows admin to update a protected field", async () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app, rest_api);

			const key = await rest_api.post(
				SSH_KEYS_URL,
				{
					public: "123123",
					private: "321321",
				},
				sessions.admin
			);

			const updated_key = await rest_api.patch(
				`${SSH_KEYS_URL}/${key.id}`,
				{
					private: "654321",
				},
				sessions.admin
			);

			assert.deepEqual(updated_key.item.private, "654321");
		}));

	it("Doesn't allow regular-user to update a protected field", async () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app, rest_api);

			const key = await rest_api.post(
				SSH_KEYS_URL,
				{
					public: "123123",
					private: "321321",
				},
				sessions.admin
			);

			await assertThrowsAsync(
				() =>
					rest_api.patch(
						`${SSH_KEYS_URL}/${key.id}`,
						{ private: "331c6883dd6010864b7ead130be77cd5" },
						sessions["regular-user"]
					),
				(e) =>
					assert.deepEqual(
						e.response.data.data.private.message,
						"you dont have any of the roles: admin."
					)
			);
		}));
});
