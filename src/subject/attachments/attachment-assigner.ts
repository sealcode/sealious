import App from "../../app/app";
import Context from "../../context";
import * as Errors from "../../response/errors";
import Collection from "../../chip-types/collection";
import { AttachmentParams, AssignAttachmentsResult } from "../types";

export default async function AssignAttachments(
	app: App,
	context: Context,
	params: AttachmentParams,
	root_collection: Collection,
	documents: Array<any>
): Promise<AssignAttachmentsResult> {
	const attachments_query = params.attachments;
	const attachments = {};
	const fieldsWithAttachments = {};

	for (let field_name of Object.keys(attachments_query)) {
		const field = root_collection.fields[field_name];
		if (!field) {
			throw new Errors.NotFound(
				`Given field ${field_name} is not declared in collection!`
			);
		}

		const loader = field.getAttachmentLoader(context, false, {
			collection_name: root_collection.name,
			attachments_query: attachments_query[field_name],
			documents,
		});
		if (!loader) {
			throw new Errors.FieldDoesNotSupportAttachments(
				`Given field ${field_name} does not support attachments!`
			);
		}

		await loader.loadTo(app, attachments, fieldsWithAttachments);
	}
	return { attachments, fieldsWithAttachments };
}
