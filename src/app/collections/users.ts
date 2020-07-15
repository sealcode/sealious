import {
	Collection,
	App,
	FieldTypes,
	Policies,
	FieldDefinitionHelper as field,
} from "../../main";

export default (app: App) => {
	app.on("started", async () => {
		const sealious_response = await app.runAction(
			new app.SuperContext(),
			["collections", "users"],
			"show",
			{ filter: { email: app.manifest.admin_email } }
		);
		if (sealious_response.empty) {
			app.Logger.warning(
				`Creating an admin account for ${app.manifest.admin_email}`
			);
			return app.runAction(
				new app.SuperContext(),
				["collections", "registration-intents"],
				"create",
				{ email: app.manifest.admin_email, role: "admin" }
			);
		}
	});

	return Collection.fromDefinition(app, {
		name: "users",
		fields: [
			field("username", FieldTypes.Username, {}, true),
			field("email", FieldTypes.Email, {}, true),
			field(
				"password",
				FieldTypes.Password,
				{
					min_length: 6,
				},
				true
			),
			field("status", FieldTypes.Text),
			field("last_login_context", FieldTypes.Context),
			field("roles", FieldTypes.ReverseSingleReference, {
				referencing_field: () =>
					app.collections["user-roles"].fields.user,
			}),
		],
		policy: {
			show: Policies.Themselves,
		},
	});
};
