import assert from "assert";
import { App } from "../../main";

export default (app: App) => {
	app.HTTPServer.custom_route(
		"POST",
		"/finalize-password-reset",
		async (app, _, params) => {
			assert(params.token, "Token missing");
			assert(params.password, "Password missing");
			const intent_response = await app.runAction(
				new app.SuperContext(),
				["collections", "password-reset-intents"],
				"show",
				{ filter: { token: params.token } }
			);
			if (intent_response.empty) {
				throw new Error("Incorrect token");
			}

			const { email, id } = intent_response.items[0];

			const user_response = await app.runAction(
				new app.SuperContext(),
				["collections", "users"],
				"show",
				{ filter: { email } }
			);
			if (user_response.empty) {
				throw new Error("No user with this email address.");
			}
			await app.runAction(
				new app.SuperContext(),
				["collections", "users", user_response.items[0].id],
				"edit",
				{ password: params.password }
			);
			await app.runAction(
				new app.SuperContext(),
				["collections", "password-reset-intents", id],
				"delete"
			);
			return "Password reset successful";
		}
	);
};
