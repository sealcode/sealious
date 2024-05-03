// possibly not needed anymore, if nothing breaks, remove it
//
//
// import { Field, Context } from "../../../main.js";

// export default class FileID extends Field {
// 	typeName = "file-id";
// 	async isProperValue(
// 		context: Context,
// 		new_file_id: string,
// 		old_value: string
// 	) {
// 		const results = await context.app.Datastore.find("files", {
// 			id: new_file_id,
// 		});
// 		if (results.length === 1) {
// 			return Field.valid();
// 		} else {
// 			return Field.invalid(context.app.i18n("invalid_file_id"));
// 		}
// 	}
// }
