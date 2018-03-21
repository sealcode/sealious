module.exports = app => {
	const declaration = {
		name: "password-reset-intents",
		fields: [
			{
				name: "email",
				type: "value-exists-in-collection",
				params: {
					collection: app.ChipManager.get_chip("collection", "users"),
					field: "email",
					include_forbidden: true,
				},
			},
			{ name: "token", type: "secret-token" },
		],
		access_strategy: {
			default: "super",
			create: "public",
			edit: "noone",
		},
	};

	app.on(
		/post:collections\.password-reset-intents:create/,
		async (path, params, intent) => {
			const token = (await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "password-reset-intents", intent.id],
				"show"
			)).body.token;
			const message = await app.MailTemplates.PasswordReset(app, {
				email_address: intent.body.email,
				token,
			});
			return message.send(app);
		}
	);

	return declaration;
};
