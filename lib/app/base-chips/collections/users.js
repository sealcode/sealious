"use strict";
module.exports = app => {
	const user_roles = app.ChipManager.get_chip("collection", "user-roles");
	const users = {
		name: "users",
		fields: [
			{
				name: "username",
				type: "username",
				required: true,
			},
			{
				name: "email",
				type: "email",
				required: true,
			},
			{
				name: "password",
				type: "password",
				params: {
					min_length: 6,
				},
				required: true,
			},
			{
				name: "status",
				type: "text",
			},
			{
				name: "last_login_context",
				type: "context",
			},
			{
				name: "roles",
				type: "reverse-single-reference",
				params: {
					collection: user_roles,
					field_name: "user",
				},
			},
		],
		access_strategy: {
			default: "public",
			show: "themselves",
		},
	};

	app.on("start", async () => {
		const matches = await app.run_action(
			new app.Sealious.SuperContext(),
			["collections", "users"],
			"show",
			{ filter: { email: app.manifest.admin_email } }
		);
		if (matches.length === 0) {
			app.Logger.warning(
				`Creating an admin account for ${app.manifest.admin_email}`
			);
			return app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "registration-intents"],
				"create",
				{ email: app.manifest.admin_email, role: "admin" }
			);
		}
	});

	return users;
};
