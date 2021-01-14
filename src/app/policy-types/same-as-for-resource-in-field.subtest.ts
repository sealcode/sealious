import assert from "assert";
import Policy from "../../chip-types/policy";
import { ActionName, App, Collection, FieldTypes, Policies } from "../../main";
import { assertThrowsAsync } from "../../test_utils/assert-throws-async";
import MockRestApi from "../../test_utils/rest-api";
import { TestAppType } from "../../test_utils/test-app";
import { withRunningApp } from "../../test_utils/with-test-app";
import Matches from "../base-chips/special_filters/matches";

const extend = (
	policies: {
		[action_name in ActionName]?: Policy;
	}
) => (t: TestAppType) => {
	const Numbers = new (class extends Collection {
		name = "numbers";
		fields = { number: new FieldTypes.Int() };
		named_filters = {
			greater_than_1: new Matches("numbers", {
				number: { ">": 1 },
			}),
		};
		policies = policies;
	})();

	const NumberNotes = new (class extends Collection {
		name = "number-notes";
		fields = {
			note: new FieldTypes.Text(),
			number: new FieldTypes.SingleReference("numbers"),
		};
		policies = {
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
			edit: new Policies.SameAsForResourceInField({
				action_name: "edit",
				field: "number",
				collection_name: "number-notes",
			}),
			list: new Policies.SameAsForResourceInField({
				action_name: "list",
				field: "number",
				collection_name: "number-notes",
			}),
		};
	})();

	return class extends t {
		collections = {
			...t.BaseCollections,
			"number-notes": NumberNotes,
			numbers: Numbers,
		};
	};
};

describe("SameAsForResourceInField", () => {
	const sessions: { [username: string]: any } = {};
	const numbers: number[] = [];
	async function setup(app: App, rest_api: MockRestApi) {
		numbers.splice(0, numbers.length); // to clear the array;

		const password = "password";
		for (const username of ["alice", "bob"]) {
			await app.collections.users.suCreate({
				username,
				password,
				email: `${username}@example.com`,
				roles: [],
			});
			sessions[username] = await rest_api.login({
				username,
				password,
			});
		}

		for (const n of [0, 1, 2]) {
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
		for (const number of numbers) {
			notes.push(
				await rest_api.post(
					"/api/v1/collections/number-notes",
					{
						note: `Lorem ipsum ${notes.length + 1}`,
						number: number,
					},
					sessions[user]
				)
			);
		}
		return notes;
	}

	it("returns everything for number-notes referring to own numbers", () =>
		withRunningApp(
			extend({
				create: new Policies.Public(),
				show: new Policies.Owner(),
			}),
			async ({ app, rest_api }) => {
				await setup(app, rest_api);

				const posted_notes = await post_number_notes(rest_api, "alice");

				const { items: got_notes } = await rest_api.get(
					"/api/v1/collections/number-notes",
					sessions.alice
				);

				assert.strictEqual(got_notes.length, posted_notes.length);
			}
		));

	it("returns nothing for number-notes referring to other user's numbers", () =>
		withRunningApp(
			extend({
				create: new Policies.Public(),
				show: new Policies.Owner(),
				list: new Policies.Owner(),
			}),
			async ({ app, rest_api }) => {
				await setup(app, rest_api);

				await post_number_notes(rest_api, "alice");

				const { items: got_notes } = await rest_api.get(
					"/api/v1/collections/number-notes",
					sessions.bob
				);

				assert.strictEqual(got_notes.length, 0);
			}
		));

	it("returns item for number-notes referring to numbers with complex access strategy", () =>
		withRunningApp(
			extend({
				create: new Policies.LoggedIn(),
				show: new Policies.Or([
					new Policies.Owner(),
					new Policies.If([
						"numbers",
						"greater_than_1",
						Policies.Public,
					]),
				]),
			}),
			async ({ app, rest_api }) => {
				await setup(app, rest_api);

				await post_number_notes(rest_api, "alice");

				const { items: got_notes } = await rest_api.get(
					"/api/v1/collections/number-notes",
					sessions.bob
				);

				assert.strictEqual(got_notes.length, 1);
			}
		));

	it("doesn't allow to edit number-notes referring to other user's numbers", () =>
		withRunningApp(
			extend({
				create: new Policies.LoggedIn(),
				edit: new Policies.Owner(),
				show: new Policies.Owner(),
			}),
			async ({ app, rest_api }) => {
				await setup(app, rest_api);
				const posted_notes = await post_number_notes(rest_api, "alice");

				await assertThrowsAsync(
					() =>
						rest_api.patch(
							`/api/v1/collections/number-notes/${
								posted_notes[0].id as string
							}`,
							{ note: "Lorem ipsumm" },
							sessions.bob
						),
					(error) => {
						assert.strictEqual(
							error.response.data.message,
							"you are not who created this item"
						);
					}
				);
			}
		));
});
