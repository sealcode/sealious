const assert = require("assert");

module.exports = app => {
	app.WwwServer.custom_route(
		"POST",
		"/finalize-registration-intent",
		async (app, context, params) => {
			assert(params.token, "Token missing");
			assert(params.username, "Username missing");
			assert(params.password, "Password missing");
			const matches = await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "registration-intents"],
				"show",
				{ filter: { token: params.token } }
			);
			if (matches.length === 0) {
				throw new Error("Incorrect token");
			} else if (matches.length > 1) {
				throw new Error("Something went wrong.");
			}
			await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "users"],
				"create",
				{
					password: params.password,
					username: params.username,
					email: matches[0].body.email,
				}
			);
			await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "registration-intents", matches[0].id],
				"delete"
			);
			return "Account creation successful";
		}
	);
};
