const assert = require("assert");
const locreq = require("locreq")(__dirname);
const { with_running_app } = locreq("test_utils/with-test-app.js");
const assert_throws_async = locreq("test_utils/assert_throws_async.js");

describe("SameAsReferencedInFieldStrategy", () => {
	let port;
	let numbers;
	const sessions = {};
	async function setup(app, rest_api, access_strategy) {
		numbers = [];
		port = app.ConfigManager.get("www-server.port");

		app.createChip(Sealious.Collection, {
			name: "numbers",
			fields: [
				{
					name: "number",
					type: "int",
				},
			],
			named_filters: {
				greater_than_1: app.SpecialFilter.Matches({
					number: { ">": 1 },
				}),
			},
			access_strategy,
		});

		app.createChip(Sealious.Collection, {
			name: "number-notes",
			fields: [
				{
					name: "note",
					type: "text",
				},
				{
					name: "number",
					type: "single_reference",
					params: { collection: "numbers" },
				},
			],
			access_strategy: {
				create: [
					"same-as-referenced-in-field",
					["create", "number", "numbers"],
				],
				retrieve: [
					"same-as-referenced-in-field",
					["retrieve", "number", "numbers"],
				],
			},
		});

		const password = "password";
		for (let username of ["alice", "bob"]) {
			const user = await app.run_action(
				new app.Sealious.SuperContext(),
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
		}

		for (let n of [0, 1, 2]) {
			numbers.push(
				(await rest_api.post(
					"/api/v1/collections/numbers",
					{
						number: n,
					},
					sessions.alice
				)).id
			);
		}
	}

	async function post_number_notes(app, rest_api, user) {
		const notes = [];
		for (let number of numbers) {
			notes.push(
				await rest_api.post(
					"/api/v1/collections/number-notes",
					{
						note: "Lorem ipsum " + (notes.length + 1),
						number: number,
					},
					sessions[user]
				)
			);
		}
		return notes;
	}

	it("returns everything for number-notes referring to own numbers", () =>
		with_running_app(async ({ app, rest_api, base_url }) => {
			await setup(app, rest_api, {
				create: "public",
				retrieve: "owner",
			});
			const posted_notes = await post_number_notes(
				app,
				rest_api,
				"alice"
			);

			const got_notes = await rest_api.get(
				"/api/v1/collections/number-notes",
				sessions.alice
			);

			assert.equal(got_notes.length, posted_notes.length);
		}));

	it("returns nothing for number-notes referring to other user's numbers", () =>
		with_running_app(async ({ app, rest_api, base_url }) => {
			await setup(app, rest_api, { create: "public", retrieve: "owner" });

			const posted_notes = await post_number_notes(
				app,
				rest_api,
				"alice"
			);

			const got_notes = await rest_api.get(
				"/api/v1/collections/number-notes",
				sessions.bob
			);

			assert.equal(got_notes.length, 0);
		}));

	it("returns item for number-notes referring to numbers with complex access strategy", () =>
		with_running_app(async ({ app, rest_api, base_url }) => {
			await setup(app, rest_api, {
				create: "logged_in",
				retrieve: [
					"or",
					[
						"owner",
						["when", ["numbers", "greater_than_1", "public"]],
					],
				],
			});

			const posted_notes = await post_number_notes(
				app,
				rest_api,
				"alice"
			);

			const got_notes = await rest_api.get(
				"/api/v1/collections/number-notes",
				sessions.bob
			);

			assert.equal(got_notes.length, 1);
		}));

	it("doesn't allow to edit number-notes referring to other user's numbers", () =>
		with_running_app(async ({ app, rest_api, base_url }) => {
			await setup(app, rest_api, {
				create: "logged_in",
				edit: "owner",
				retrieve: "owner",
			});
			const posted_notes = await post_number_notes(
				app,
				rest_api,
				"alice"
			);

			await assert_throws_async(
				() =>
					rest_api.patch(
						`/api/v1/collections/number-notes/${
							posted_notes[0].id
						}`,
						{ note: "Lorem ipsumm" },
						sessions.bob
					),
				({ response }) => {
					assert.equal(
						response.data.message,
						"Only the owner of this resource can perform this operation on this item."
					);
				}
			);
		}));
});
