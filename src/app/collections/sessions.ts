import {
	App,
	Collection,
	FieldTypes,
	AccessStrategies,
	FieldDefinitionHelper as field,
} from "../../main";

export default (app: App) => {
	return Collection.fromDefinition(app, {
		name: "sessions",
		fields: [
			field("session-id", FieldTypes.SessionID),
			field("user", FieldTypes.SingleReference, {
				target_collection: () => app.collections.users,
			}),
		],
		access_strategy: {
			default: AccessStrategies.Super,
		},
	});
};
