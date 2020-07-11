import {
	App,
	EventMatchers,
	Collection,
	FieldTypes,
	AccessStrategies,
	FieldDefinitionHelper as field,
} from "../../main";
import PasswordResetTemplate from "../../email/templates/password-reset";

export default (app: App) => {
	app.addHook(
		new EventMatchers.Collection({
			when: "after",
			collection_name: "password-reset-intents",
			action: "create",
		}),
		async ({ metadata }, intent) => {
			const { token } = await app.runAction(
				new app.Sealious.SuperContext(metadata.context),
				["collections", "password-reset-intents", intent.id],
				"show"
			);
			const message = await PasswordResetTemplate(app, {
				email_address: intent.email,
				token,
			});
			await message.send(app);
		}
	);

	return Collection.fromDefinition(app, {
		name: "password-reset-intents",
		fields: [
			field("email", FieldTypes.ValueExistingInCollection, {
				field: () => app.collections.users.fields.email,
				include_forbidden: true,
			}),
			field("token", FieldTypes.SecretToken),
		],
		access_strategy: {
			default: AccessStrategies.Super,
			create: AccessStrategies.Public,
			edit: AccessStrategies.Noone,
		},
	});
};
