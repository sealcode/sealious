import assert from "assert";
import { App } from "../../main";

export default (app: App) => {
	app.HTTPServer.custom_route(
		"POST",
		"/finalize-password-reset",
		async (app, _, params) => {
			assert(params.token, "Token missing");
			assert(params.password, "Password missing");
			const intent_response = await app.collections[
				"password-reset-intents"
			]
				.suList()
				.filter({ token: params.token })
				.fetch();

			if (intent_response.empty) {
				throw new Error("Incorrect token");
			}

			const intent = intent_response.items[0];

			const user_response = await app.collections.users
				.suList()
				.filter({ email: intent.get("email") })
				.fetch();
			if (user_response.empty) {
				throw new Error("No user with this email address.");
			}
			user_response.items[0].set("password", params.password);
			await user_response.items[0].save(new app.SuperContext());
			await intent.remove(new app.SuperContext());
			return "Password reset successful";
		}
	);
};
