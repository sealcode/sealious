module.exports = app => {
	const declaration = {
		name: "password-reset-intents",
		fields: [
			{
				name: "email",
				type: "value-existing-in-collection",
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

	app.EventManager.subscribeToIntentionCreate(
		"password-reset-intents",
		"PasswordReset"
	);

	return declaration;
};
