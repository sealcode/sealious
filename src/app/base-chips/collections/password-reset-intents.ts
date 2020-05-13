import { App, EventMatchers, EmailTemplates } from "../../../main";

module.exports = (app: App) => {
	const declaration = {
		name: "password-reset-intents",
		fields: [
			{
				name: "email",
				type: "value-existing-in-collection",
				params: {
					collection: app.ChipManager.getCollection("users"),
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

	app.addHook(
		new EventMatchers.Collection({
			when: "after",
			collection_name: "password-reset-intents",
			action: "create",
		}),
		async ({ metadata }, intent) => {
			const { token } = await app.run_action(
				new app.Sealious.SuperContext(metadata.context),
				["collections", "password-reset-intents", intent.id],
				"show"
			);

			const message = await EmailTemplates.PasswordReset(app, {
				email_address: intent.email,
				token,
			});
			await message.send(app);
		}
	);

	return declaration;
};
