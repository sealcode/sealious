import AttachmentLoader from "./attachment-loader.js";
import _get from "lodash.get";

export default class ReferenceToCollection extends AttachmentLoader {
	constructor(
		context,
		field_name,
		{ collection, attachments_query, documents }
	) {
		super(context, field_name);
		this.context = context;
		this.field_name = field_name;
		this.documents = documents;
		this.collection = collection;
		this.attachments_query = attachments_query;
	}
	async loadTo(app, attachments, fieldsWithAttachments) {
		const ids = this._extractIds();

		const response = await app.run_action(
			this.context,
			["collections", this.collection, Array.from(ids)],
			"show",
			this._getActionParams(this.attachments_query)
		);

		const subattachments = response.getAttachments();

		Object.assign(attachments, subattachments);

		response.items.forEach((document) => {
			attachments[document.id] = document;
		});

		const submetadata = response.getMetadata();

		fieldsWithAttachments[this.field_name] = {};
		if (submetadata) {
			Object.assign(fieldsWithAttachments[this.field_name], submetadata);
		}
	}
	_extractIds() {
		const ids = new Set();
		for (let document of this.documents) {
			if (Array.isArray(document[this.field_name])) {
				for (let id of document[this.field_name]) {
					ids.add(id);
				}
			} else {
				ids.add(document[this.field_name]);
			}
		}
		return ids;
	}
	_getActionParams(attachments_query) {
		return typeof attachments_query === "object"
			? { attachments: attachments_query }
			: {};
	}
}
