import { Collection, FieldTypes, Policies } from "../../main";

export default class FormattedImages extends Collection {
	name = "formatted-images";
	fields = {
		original_photo_file: new FieldTypes.FileID(),
		formatted_photo_file: new FieldTypes.FileID(),
		format: new FieldTypes.Text(),
	};
	defaultPolicy = new Policies.Super();
	policies = {};
}
