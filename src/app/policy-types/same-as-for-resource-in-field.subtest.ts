import assert from "assert";
import { withRunningApp, MockRestApi } from "../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../test_utils/assert-throws-async";
import {
	App,
	Collection,
	ActionName,
	FieldTypes,
	Policies,
	FieldDefinitionHelper as field,
} from "../../main";
import { PolicyDefinition } from "../../chip-types/policy";
import Matches from "../base-chips/special_filters/matches";

describe("SameAsForResourceInField", () => {
	const sessions: { [username: string]: any } = {};
	const numbers: number[] = [];
	async function setup(
		app: App,
		rest_api: MockRestApi,
		policy: {
			[action_name in ActionName]?: PolicyDefinition;
		}
	) {
		numbers.splice(0, numbers.length); // to clear the array;
		const Numbers = Collection.fromDefinition(app, {
			name: "numbers",
			fields: [field("number", FieldTypes.Int)],
			named_filters: {
				greater_than_1: new Matches(
					app,
					() => app.collections.numbers,
					{
						number: { ">": 1 },
					}
				),
			},
			policy,
		});

		Collection.fromDefinition(app, {
			name: "number-notes",
			fields: [
				field("note", FieldTypes.Text),
				field("number", FieldTypes.SingleReference, {
					target_collection: () => Numbers,
				}),
			],
			policy: {
				create: new Policies.SameAsForResourceInField({
					action_name: "create",
					field: "number",
					collection_name: "number-notes",
				}),

				show: new Policies.SameAsForResourceInField({
					action_name: "show",
					field: "number",
					collection_name: "number-notes",
				}),
			},
		});

		const password = "password";
		for (let username of ["alice", "bob"]) {
			await app.runAction(
				new app.SuperContext(),
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
				(
					await rest_api.post(
						"/api/v1/collections/numbers",
						{
							number: n,
						},
						sessions.alice
					)
				).id
			);
		}
	}

	async function post_number_notes(rest_api: MockRestApi, user: string) {
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
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app, rest_api, {
				create: Policies.Public,
				show: Policies.Owner,
			});

			const posted_notes = await post_number_notes(rest_api, "alice");

			const { items: got_notes } = await rest_api.get(
				"/api/v1/collections/number-notes",
				sessions.alice
			);

			assert.equal(got_notes.length, posted_notes.length);
		}));

	it("returns nothing for number-notes referring to other user's numbers", () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app, rest_api, {
				create: Policies.Public,
				show: Policies.Owner,
			});

			await post_number_notes(rest_api, "alice");

			const { items: got_notes } = await rest_api.get(
				"/api/v1/collections/number-notes",
				sessions.bob
			);

			assert.equal(got_notes.length, 0);
		}));

	it("returns item for number-notes referring to numbers with complex access strategy", () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app, rest_api, {
				create: Policies.LoggedIn,
				show: new Policies.Or([
					Policies.Owner,

					new Policies.If([
						"numbers",
						"greater_than_1",
						Policies.Public,
					]),
				]),
			});

			await post_number_notes(rest_api, "alice");

			const { items: got_notes } = await rest_api.get(
				"/api/v1/collections/number-notes",
				sessions.bob
			);

			assert.equal(got_notes.length, 1);
		}));

	it("doesn't allow to edit number-notes referring to other user's numbers", () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app, rest_api, {
				create: Policies.LoggedIn,
				edit: Policies.Owner,
				show: Policies.Owner,
			});
			const posted_notes = await post_number_notes(rest_api, "alice");

			await assertThrowsAsync(
				() =>
					rest_api.patch(
						`/api/v1/collections/number-notes/${posted_notes[0].id}`,
						{ note: "Lorem ipsumm" },
						sessions.bob
					),
				(error) => {
					assert.equal(
						(error as any).response.data.message,
						"you are not who created this item"
					);
				}
			);
		}));
});
