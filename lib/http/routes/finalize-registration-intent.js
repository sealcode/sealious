const assert = require("assert");

module.exports = app => {
	app.WwwServer.custom_route(
		"POST",
		"/finalize-registration-intent",
		async (app, context, params) => {
			assert(params.token, "Token missing");
			assert(params.username, "Username missing");
			assert(params.password, "Password missing");
			const response = await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "registration-intents"],
				"show",
				{ filter: { token: params.token } }
			);

			if (response.empty) {
				throw new Error("Incorrect token");
			}

			const { email, role, id } = response.items[0];
			const user = await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "users"],
				"create",
				{
					password: params.password,
					username: params.username,
					email,
				}
			);
			if (role) {
				await app.run_action(
					new app.Sealious.SuperContext(),
					["collections", "user-roles"],
					"create",
					{ user: user.id, role }
				);
			}
			await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "registration-intents", id],
				"delete"
			);
			return "Account creation successful";
		}
	);
};
