const assert = require("assert");

module.exports = app => {
	app.WwwServer.custom_route(
		"POST",
		"/finalize-password-reset",
		async (app, context, params) => {
			assert(params.token, "Token missing");
			assert(params.password, "Password missing");
			const intent_response = await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "password-reset-intents"],
				"show",
				{ filter: { token: params.token } }
			);
			if (intent_response.empty) {
				throw new Error("Incorrect token");
			}

			const { email, id } = intent_response.items[0];

			const user_response = await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "users"],
				"show",
				{ filter: { email } }
			);
			if (user_response.empty) {
				throw new Error("No user with this email address.");
			}
			await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "users", user_response.items[0].id],
				"edit",
				{ password: params.password }
			);
			await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "password-reset-intents", id],
				"delete"
			);
			return "Password reset successful";
		}
	);
};
