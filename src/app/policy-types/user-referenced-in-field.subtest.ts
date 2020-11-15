import assert from "assert";
import { withStoppedApp } from "../../test_utils/with-test-app";
import { Collection, FieldTypes, Policies } from "../../main";
import { TestAppType } from "../../test_utils/test-app";

function extend(t: TestAppType) {
	const pets = new (class extends Collection {
		name = "pets";
		fields = {
			name: new FieldTypes.Text(),
			owner: new FieldTypes.SingleReference("users"),
		};
		policies = {
			create: new Policies.Public(),
			default: new Policies.UserReferencedInField("owner"),
		};
	})();

	return class extends t {
		collections = {
			...t.BaseCollections,
			pets,
		};
	};
}

describe("user-referenced-in-field", () => {
	it("should deny if the user isn't the one referenced in the field and allow if it is", async () =>
		withStoppedApp(extend, async ({ app, rest_api }) => {
			for (let username of ["Alice", "Bob"]) {
				const user = await app.collections.users.suCreate({
					username,
					password: "password",
					email: `${username.toLowerCase()}@example.com`,
					roles: [],
				});

				await app.collections.pets.suCreate({
					name: `${username}'s pet`,
					owner: user.id,
				});
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
