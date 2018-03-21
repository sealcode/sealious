module.exports = app => {
	const declaration = {
		name: "registration-intents",
		fields: [
			{
				name: "email",
				type: "value-not-existing-in-collection",
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
		/post:collections\.registration-intents:create/,
		async (path, params, intent) => {
			const token = (await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "registration-intents", intent.id],
				"show"
			)).body.token;
			const message = await app.MailTemplates.RegistrationIntent(app, {
				email_address: intent.body.email,
				token,
			});
			return message.send(app);
		}
	);

	return declaration;
};
