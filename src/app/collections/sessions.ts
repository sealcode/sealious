import {
	App,
	Collection,
	FieldTypes,
	Policies,
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
		policy: {
			default: Policies.Super,
		},
	});
};
