module.exports = app => {
	const user_roles = app.ChipManager.get_chip("collection", "user-roles");
	const declaration = {
		name: "registration-intents",
		fields: [
			{
				name: "email",
				required: true,
				type: "value-not-existing-in-collection",
				params: {
					collection: app.ChipManager.get_chip("collection", "users"),
					field: "email",
					include_forbidden: true,
				},
			},
			{ name: "token", type: "secret-token" },
			{
				name: "role",
				type: "settable-by",
				params: {
					access_strategy_description: [
						"users-who-can",
						["create", user_roles],
					],
					target_field_type: app.ChipManager.get_chip(
						"field_type",
						"enum"
					),
					target_params: {
						values: () => app.ConfigManager.get("roles"),
					},
				},
			},
		],
		access_strategy: {
			default: "super",
			create: "public",
			edit: "noone",
		},
	};

	app.addHook(
		new app.Sealious.EventMatchers.Collection({
			when: "after",
			collection_name: "registration-intents",
			action: "create",
		}),
		async (emitted_event, intent) => {
			const token = (await app.run_action(
				new app.Sealious.SuperContext(emitted_event.metadata.context),
				["collections", "registration-intents", intent.id],
				"show"
			)).body.token;
			const message = await app.MailTemplates.RegistrationIntent(app, {
				email_address: intent.body.email,
				token,
			});
			await message.send(app);
		}
	);

	return declaration;
};
