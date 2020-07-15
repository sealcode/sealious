import {
	App,
	Collection,
	FieldTypes,
	Policies,
	ActionName,
	FieldDefinitionHelper as field,
} from "../../main";

export default (app: App) => {
	app.on("started", async () => {
		const roles = app.collections["user-roles"];
		for (let action of ["create", "delete"] as ActionName[]) {
			const policy = roles.getPolicy(action);
			if (policy === Policies.Public) {
				app.Logger.warning(
					`<user-roles> collection is using <public> access strategy for ${action} action. Anyone can change anyone elses role. This is the default behavior and you should overwrite it with <set_policy>`
				);
			}
		}
	});

	return Collection.fromDefinition(app, {
		name: "user-roles",
		fields: [
			field(
				"role",
				FieldTypes.Enum,
				{
					values: () => app.ConfigManager.get("roles"),
				},
				true
			),
			field(
				"user",
				FieldTypes.SingleReference,
				{ target_collection: () => app.collections.users },
				true
			),
		],
		policy: {
			create: Policies.Public,
			delete: Policies.Public,
			show: [Policies.UserReferencedInField, "user"],
			edit: Policies.Noone,
		},
	});
};
