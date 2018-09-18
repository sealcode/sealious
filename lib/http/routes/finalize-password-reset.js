const assert = require("assert");

module.exports = app => {
	app.WwwServer.custom_route(
		"POST",
		"/finalize-password-reset",
		async (app, context, params) => {
			assert(params.token, "Token missing");
			assert(params.password, "Password missing");
			const { items: matches } = await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "password-reset-intents"],
				"show",
				{ filter: { token: params.token } }
			);
			if (matches.length === 0) {
				throw new Error("Incorrect token");
			} else if (matches.length > 1) {
				throw new Error("Something went wrong.");
			}
			const user_email = matches[0].email;
			const {
				items: [user],
			} = await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "users"],
				"show",
				{ filter: { email: user_email } }
			);
			if (!user) {
				throw new Error("No user with this email address.");
			}
			await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "users", user.id],
				"edit",
				{ password: params.password }
			);
			await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "password-reset-intents", matches[0].id],
				"delete"
			);
			return "Password reset successful";
		}
	);
};
