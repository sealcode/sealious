import {
	App,
	Collection,
	FieldTypes,
	Policies,
	FieldDefinitionHelper as field,
	EventMatchers,
} from "../../main";
import RegistrationIntentTemplate from "../../email/templates/registration-intent";

export default (app: App) => {
	app.addHook(
		new EventMatchers.CollectionMatcher({
			when: "after",
			collection_name: "registration-intents",
			action: "create",
		}),
		async (_, intent) => {
			const token = (
				await app.runAction(
					new app.SuperContext(),
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
				policy: new Policies.UsersWhoCan(["create", "user-roles"]),
				base_field_type: FieldTypes.Enum,
				base_field_params: {
					values: () => app.ConfigManager.get("roles"),
				},
			}),
		],
		policy: {
			default: Policies.Super,
			create: Policies.Public,
			edit: Policies.Noone,
		},
	});
};
