import assert from "assert";
import { withRunningApp } from "../../test_utils/with-test-app.js";

describe("sessions", () => {
	it("handles login and logout properly", () =>
		withRunningApp(
			(app) => app,
			async ({ app }) => {
				const user = await app.collections.users.suCreate({
					username: "useruser",
					password: "password",
				});
				const session_id = await app.collections.sessions.login(
					"useruser",
					"password"
				);
				const {
					items: [session],
				} = await app.collections.sessions
					.suList()
					.filter({ "session-id": session_id })
					.fetch();
				assert.strictEqual(session.get("user"), user.id);

				await app.collections.sessions.logout(
					new app.SuperContext(),
					session_id
				);

				const result_after_logout = await app.collections.sessions
					.suList()
					.filter({ "session-id": session_id })
					.fetch();

				assert.strictEqual(result_after_logout.items.length, 0);
			}
		));
});
