import {
	App,
	Collection,
	FieldTypes,
	AccessStrategies,
	FieldDefinitionHelper as field,
} from "../../main";
import RegistrationIntentTemplate from "../../email/templates/registration-intent";

export default (app: App) => {
	app.addHook(
		new app.Sealious.EventMatchers.Collection({
			when: "after",
			collection_name: "registration-intents",
			action: "create",
		}),
		async (emitted_event, intent) => {
			const token = (
				await app.runAction(
					new app.Sealious.SuperContext(
						emitted_event.metadata.context
					),
					["collections", "registration-intents", intent.id],
					"show"
				)
			).token;
			const message = await RegistrationIntentTemplate(app, {
				email_address: intent.email,
				token,
			});
			await message.send(app);
		}
	);

	return Collection.fromDefinition(app, {
		name: "registration-intents",
		fields: [
			field(
				"email",
				FieldTypes.ValueNotExistingInCollection,
				{
					field: () => app.collections.users.fields.email,
					include_forbidden: true,
				},
				true
			),
			field("token", FieldTypes.SecretToken),
			field("role", FieldTypes.SettableBy, {
				access_strategy: new AccessStrategies.UsersWhoCan([
					"create",
					"user-roles",
				]),
				base_field_type: FieldTypes.Enum,
				base_field_params: {
					values: () => app.ConfigManager.get("roles"),
				},
			}),
		],
		access_strategy: {
			default: AccessStrategies.Super,
			create: AccessStrategies.Public,
			edit: AccessStrategies.Noone,
		},
	});
};
