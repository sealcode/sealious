import assert from "assert";
import { withStoppedApp } from "../../test_utils/with-test-app";
import {
	Collection,
	FieldTypes,
	Policies,
	FieldDefinitionHelper as field,
} from "../../main";

describe("user-referenced-in-field", () => {
	it("should deny if the user isn't the one referenced in the field and allow if it is", async () =>
		withStoppedApp(async ({ app, rest_api }) => {
			await Collection.fromDefinition(app, {
				name: "pets",
				fields: [
					field("name", FieldTypes.Text),
					field("owner", FieldTypes.SingleReference, {
						target_collection: () => app.collections.users,
					}),
				],
				policy: {
					create: Policies.Public,
					default: new Policies.UserReferencedInField("owner"),
				},
			});
			await app.start();

			for (let username of ["Alice", "Bob"]) {
				const user = await app.runAction(
					new app.SuperContext(),
					["collections", "users"],
					"create",
					{
						username: username,
						password: "password",
						email: `${username.toLowerCase()}@example.com`,
					}
				);
				await app.runAction(
					new app.SuperContext(),
					["collections", "pets"],
					"create",
					{ name: `${username}'s pet`, owner: user.id }
				);
			}

			const alice_session = await rest_api.login({
				username: "Alice",
				password: "password",
			});

			const { items } = await rest_api.get(
				"/api/v1/collections/pets",
				alice_session
			);
			assert.equal(items.length, 1);
			assert.equal(items[0].name, "Alice&#39;s pet");
		}));
});
