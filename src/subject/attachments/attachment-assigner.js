const Errors = require("../../response/error.js");

module.exports = async function (
	app,
	context,
	params,
	root_collection,
	documents
) {
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

		const loader = await field.get_attachment_loader(context, field_name, {
			...field.params,
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
};
