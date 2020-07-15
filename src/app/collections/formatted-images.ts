import App from "../app";
import {
	Collection,
	FieldTypes,
	Policies,
	FieldDefinitionHelper as field,
} from "../../main";

export default (app: App) => {
	return Collection.fromDefinition(app, {
		name: "formatted-images",
		fields: [
			field("original_photo_file", FieldTypes.FileID, {}, true),
			field("formatted_photo_file", FieldTypes.FileID, {}, true),
			field("format", FieldTypes.Text, {}, true),
		],
		policy: {
			default: Policies.Super,
		},
	});
};
