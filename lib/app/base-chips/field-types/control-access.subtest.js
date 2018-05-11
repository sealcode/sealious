const assert = require("assert");
const locreq = require("locreq")(__dirname);
const { with_running_app } = locreq("test_utils/with-test-app.js");
const assert_throws_async = locreq("test_utils/assert_throws_async.js");
const SSH_KEYS_URL = "/api/v1/collections/ssh-keys";

describe("control-access", () => {
	let sessions = {};
	async function create_ssh_keys_collections(App) {
		App.createChip(App.Sealious.Collection, {
			name: "ssh-keys",
			fields: [
				{
					name: "public",
					type: "text",
					required: true,
				},
				{
					name: "private",
					type: "control-access",
					params: {
						target_access_strategies: {
							retrieve: ["roles", ["admin"]],
							update: ["roles", ["admin"]],
						},
						target_field_type_name: "text",
						target_params: {
							min_length: 3,
						},
					},
					required: true,
				},
			],
			access_strategy: {
				default: "public",
				create: ["roles", ["admin"]],
			},
		});
	}

	async function setup_users(App, rest_api, base_url) {
		const password = "it-really-doesnt-matter";
		let admin_id;
		for (let username of ["admin", "regular-user"]) {
			const user = await App.run_action(
				new App.Sealious.SuperContext(),
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

	async function fill_keys_collections(App) {
		const keys = [
			{
				public: "a-public-key",
				private: "seeeeecret",
			},
			{
				public: "go-get-it",
				private: "you-cannot-see",
			},
		];
		for (let { public, private } of keys) {
			let key = await App.run_action(
				new App.Sealious.SuperContext(),
				["collections", "ssh-keys"],
				"create",
				{
					public,
					private,
				}
			);
		}
	}

	async function setup(app, rest_api, base_url) {
		await create_ssh_keys_collections(app);
		await fill_keys_collections(app);
		await setup_users(app, rest_api, base_url);
	}

	it("Hides a protected value from regular-user", async () =>
		with_running_app(async ({ app, rest_api, base_url }) => {
			await setup(app, rest_api, base_url);

			const ssh_keys = await rest_api.get(
				SSH_KEYS_URL,
				sessions["regular-user"]
			);

			ssh_keys.forEach(key => {
				assert.deepEqual(key.body.private, "");
			});
		}));

	it("Uncovers a protected value for admin", async () =>
		with_running_app(async ({ app, rest_api, base_url }) => {
			await setup(app, rest_api, base_url);

			const ssh_keys = await rest_api.get(SSH_KEYS_URL, sessions.admin);

			ssh_keys.forEach(key => {
				assert(key.body.private.length >= 3);
			});
		}));

	it("Respects given field type constraints", async () =>
		with_running_app(async ({ app, rest_api, base_url }) => {
			await setup(app, rest_api, base_url);

			await assert_throws_async(
				() =>
					rest_api.post(
						SSH_KEYS_URL,
						{
							public: "XDDDDDDDDDDDD",
							private: "XD",
						},
						sessions.admin
					),
				e =>
					assert.equal(
						e.response.data.data.private.message,
						"Text 'XD' is too short, minimum length is 3 chars."
					)
			);
		}));

	it("Allows admin to update a protected field", async () =>
		with_running_app(async ({ app, rest_api, base_url }) => {
			await setup(app, rest_api, base_url);

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

			assert.deepEqual(updated_key.body.private, "654321");
		}));

	it("Doesn't allow regular-user to update a protected field", async () =>
		with_running_app(async ({ app, rest_api, base_url }) => {
			await setup(app, rest_api, base_url);

			const key = await rest_api.post(
				SSH_KEYS_URL,
				{
					public: "123123",
					private: "321321",
				},
				sessions.admin
			);

			await assert_throws_async(
				() =>
					rest_api.patch(
						`${SSH_KEYS_URL}/${key.id}`,
						{ private: "331c6883dd6010864b7ead130be77cd5" },
						sessions["regular-user"]
					),
				e =>
					assert.deepEqual(
						e.response.data.data.private.message,
						"You are not allowed to update this field."
					)
			);
		}));
});
