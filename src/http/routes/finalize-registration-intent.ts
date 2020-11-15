import assert from "assert";
import { App } from "../../main";

export default (app: App) => {
	app.HTTPServer.custom_route(
		"POST",
		"/finalize-registration-intent",
		async (app, _, params) => {
			assert(params.token, "Token missing");
			assert(params.username, "Username missing");
			assert(params.password, "Password missing");
			const intents = await app.collections["registration-intents"]
				.suList()
				.filter({ token: params.token })
				.fetch();
			if (intents.empty) {
				throw new Error("Incorrect token");
			}

			const intent = intents.items[0];
			const user = await app.collections.users.suCreate({
				password: params.password,
				username: params.username,
				email: intent.get("email"),
				roles: [],
			});
			if (intent.get("role")) {
				await app.collections["user-roles"].suCreate({
					user: user.id,
					role: intent.get("role"),
				});
			}
			await intent.remove(new app.SuperContext());
			const target_path = app.ConfigManager.get(
				"accout_creation_success_path"
			);
			if (target_path) {
				assert.equal(
					target_path[0],
					"/",
					"'accout_creation_success_path' set, but doesn't start with a '/'"
				);
				return `<meta http-equiv="refresh" content="0; url=${target_path}" />`;
			}
			return "Account creation successful";
		}
	);
};
