import {
	type TestAppConstructor,
	withRunningApp,
} from "../../test_utils/with-test-app.js";
import { TestApp } from "../../test_utils/test-app.js";
import {
	Collection,
	Context,
	FieldTypes,
	Policies,
	Policy,
} from "../../main.js";
import assert from "assert";
import { assertThrowsAsync } from "../../test_utils/assert-throws-async.js";

const extend = (defaultPolicy: Policy) => (t: TestAppConstructor) => {
	return class extends t {
		collections = {
			...TestApp.BaseCollections,
			numbers: new (class extends Collection {
				name = "numbers";
				fields = {
					number: new FieldTypes.Int(),
				};

				policies = {
					create: new Policies.Public(),
				};

				defaultPolicy = defaultPolicy;
			})(),
		};
	};
};

describe("OwnerPolicy", () => {
	it("it allows only the owner to access the item they created", async () => {
		await withRunningApp(extend(new Policies.Owner()), async ({ app }) => {
			const owner = await app.collections.users.suCreate({
				password: "12345678",
				username: "Adam",
			});
			const guest = await app.collections.users.suCreate({
				password: "12345678",
				username: "Guest",
			});

			const ownerContext = new Context({ app, user_id: owner.id });
			const guestContext = new Context({ app, user_id: guest.id });
			const notLoggedInContext = new Context({ app });

			await app.collections.numbers.create(ownerContext, { number: 12 });

			const ownerRetrive = await app.collections.numbers
				.list(ownerContext)
				.fetch();
			assert.strictEqual(ownerRetrive.items.length, 1);

			const guestRetrive = await app.collections.numbers
				.list(guestContext)
				.fetch();
			assert.strictEqual(guestRetrive.items.length, 0);

			const notLoggedInRetrive = await app.collections.numbers
				.list(notLoggedInContext)
				.fetch();
			assert.strictEqual(notLoggedInRetrive.items.length, 0);
		});
	});
	it("it doesn't allow owner to access items they have created when used with Not", async () => {
		await withRunningApp(
			extend(new Policies.Not(new Policies.Owner())),
			async ({ app }) => {
				const owner = await app.collections.users.suCreate({
					password: "12345678",
					username: "Adam",
				});
				const guest = await app.collections.users.suCreate({
					password: "12345678",
					username: "Guest",
				});

				const ownerContext = new Context({ app, user_id: owner.id });
				const guestContext = new Context({ app, user_id: guest.id });

				const item = await app.collections.numbers.create(
					ownerContext,
					{ number: 12 }
				);
				await assertThrowsAsync(
					async () =>
						await app.collections.numbers.getByID(
							ownerContext,
							item.id,
							true
						),
					(error) => {
						assert.strictEqual(
							error.message,
							ownerContext.app.i18n("policy_not_allow", [
								ownerContext.app.i18n("policy_owner_allow"),
							])
						);
					}
				);

				const guestRetrive = await app.collections.numbers.getByID(
					guestContext,
					item.id,
					true
				);
				assert.strictEqual(guestRetrive.get("number"), 12);
			}
		);
	});
});
