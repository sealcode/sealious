import {
	App,
	Collection,
	FieldTypes,
	AccessStrategies,
	ActionName,
	FieldDefinitionHelper as field,
} from "../../main";

export default (app: App) => {
	app.on("started", async () => {
		const roles = app.collections["user-roles"];
		for (let action of ["create", "delete"] as ActionName[]) {
			const access_strategy = roles.getAccessStrategy(action);
			if (access_strategy === AccessStrategies.Public) {
				app.Logger.warning(
					`<user-roles> collection is using <public> access strategy for ${action} action. Anyone can change anyone elses role. This is the default behavior and you should overwrite it with <set_access_strategy>`
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
		access_strategy: {
			create: AccessStrategies.Public,
			delete: AccessStrategies.Public,
			show: [AccessStrategies.UserReferencedInField, "user"],
			edit: AccessStrategies.Noone,
		},
	});
};
