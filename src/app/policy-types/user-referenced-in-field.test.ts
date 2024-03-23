import assert from "assert";
import { TestAppConstructor, withRunningApp } from "../../test_utils/with-test-app.js";
import { Collection, FieldTypes, Policies } from "../../main.js";
import { TestApp } from "../../test_utils/test-app.js";

function extend(t: TestAppConstructor) {
	const pets = new (class extends Collection {
		name = "pets";
		fields = {
			name: new FieldTypes.Text(),
			owner: new FieldTypes.SingleReference("users"),
		};
		policies = {
			create: new Policies.Public(),
		};
		defaultPolicy = new Policies.UserReferencedInField("owner");
	})();

	return class extends t {
		collections = {
			...TestApp.BaseCollections,
			pets,
		};
	};
}

describe("user-referenced-in-field", () => {
	it("should deny if the user isn't the one referenced in the field and allow if it is", async () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			for (let username of ["Alice", "Bob"]) {
				const user = await app.collections.users.suCreate({
					username,
					password: "password",
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

			const { items } = await rest_api.get("/api/v1/collections/pets", alice_session);
			assert.strictEqual(items.length, 1);
			assert.strictEqual(items[0].name, "Alice&#39;s pet");
		}));
});
