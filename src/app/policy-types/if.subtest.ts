import assert from "assert";
import { withStoppedApp } from "../../test_utils/with-test-app";
import {
	App,
	Collection,
	FieldTypes,
	Policies,
	FieldDefinitionHelper as field,
} from "../../main";
import Matches from "../base-chips/special_filters/matches";

describe("when", () => {
	async function createResources(app: App) {
		Collection.fromDefinition(app, {
			name: "numbers",
			fields: [
				field("number", FieldTypes.Int),
				field("number_str", FieldTypes.Text),
			],
			named_filters: {
				positive: new Matches(app, () => app.collections.numbers, {
					number: { ">": 0 },
				}),
				negative: new Matches(app, () => app.collections.numbers, {
					number: { "<": 0 },
				}),
			},
			policy: {
				default: new Policies.If([
					"numbers",
					"negative",
					Policies.LoggedIn,
					Policies.Public,
				]),
			},
		});

		await app.start();

		for (let number of [-1, 0, 1]) {
			await app.runAction(
				new app.SuperContext(),
				["collections", "numbers"],
				"create",
				{ number, number_str: number.toString() }
			);
		}

		await app.runAction(
			new app.SuperContext(),
			["collections", "users"],
			"create",
			{
				username: "user",
				password: "password",
				email: "user@example.com",
			}
		);
	}

	it("should only use 'when_true' access strategy when the item passes the filter", async () =>
		withStoppedApp(async ({ app, rest_api }) => {
			await createResources(app);
			const session = await rest_api.login({
				username: "user",
				password: "password",
			});

			const { items: resources_when_logged_in } = await rest_api.get(
				"/api/v1/collections/numbers?sort[number]=asc",
				session
			);

			assert.equal(resources_when_logged_in.length, 3);
			assert.equal(resources_when_logged_in[0].number, -1);
		}));

	it("should only use 'when_false' access strategy when the item doesn't pass the filter", async () =>
		withStoppedApp(async ({ app, rest_api }) => {
			await createResources(app);

			const { items: public_resources } = await rest_api.get(
				"/api/v1/collections/numbers?sort[number]=asc"
			);

			assert.equal(public_resources.length, 2);
		}));
});
