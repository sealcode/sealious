import { withRunningApp } from "./test_utils/with-test-app.js";
import { default as Context } from "./context.js";
import assert from "assert";

describe("context", () => {
	it("Exposes user roles in getRoles() method", async () => {
		return withRunningApp(
			(t) => {
				return t;
			},
			async ({ app }) => {
				const user = await app.collections.users.create(
					new app.SuperContext(),
					{
						username: "admin",
						password: "password",
						roles: [{ role: "admin" }],
					}
				);
				const context = new Context(app, Date.now(), user.id);
				assert.deepStrictEqual(await context.getRoles(), ["admin"]);
			}
		);
	});
});
