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
			const response = await app.runAction(
				new app.SuperContext(),
				["collections", "registration-intents"],
				"show",
				{ filter: { token: params.token } }
			);

			if (response.empty) {
				throw new Error("Incorrect token");
			}

			const { email, role, id } = response.items[0];
			const user = await app.runAction(
				new app.SuperContext(),
				["collections", "users"],
				"create",
				{
					password: params.password,
					username: params.username,
					email,
				}
			);
			if (role) {
				await app.runAction(
					new app.SuperContext(),
					["collections", "user-roles"],
					"create",
					{ user: user.id, role }
				);
			}
			await app.runAction(
				new app.SuperContext(),
				["collections", "registration-intents", id],
				"delete"
			);
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
