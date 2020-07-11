import { Field, Context } from "../../../main";

export default class FileID extends Field {
	getTypeName = () => "file-id";
	async isProperValue(
		context: Context,
		new_file_id: string,
		old_value: string
	) {
		const results = await context.app.Datastore.find("files", {
			id: new_file_id,
		});
		if (results.length === 1) {
			return Field.valid();
		} else {
			return Field.invalid("File of given ID does not exist");
		}
	}
}
