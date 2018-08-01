const assert = require("assert");

module.exports = app => {
	app.WwwServer.custom_route(
		"POST",
		"/finalize-registration-intent",
		async (app, context, params) => {
			assert(params.token, "Token missing");
			assert(params.username, "Username missing");
			assert(params.password, "Password missing");
			const { items: matches } = await app.run_action(
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
			const intent = matches[0];
			const user = await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "users"],
				"create",
				{
					password: params.password,
					username: params.username,
					email: intent.body.email,
				}
			);
			if (intent.body.role) {
				await app.run_action(
					new app.Sealious.SuperContext(),
					["collections", "user-roles"],
					"create",
					{ user: user.id, role: intent.body.role }
				);
			}
			await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "registration-intents", matches[0].id],
				"delete"
			);
			return "Account creation successful";
		}
	);
};
