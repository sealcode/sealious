const ReferenceField = require("../sealious_response_fields/reference-field.js");

module.exports = class SealiousResponse {
	constructor({ items, attachments, fieldsWithAttachments }) {
		this._attachments = attachments;
		this._fieldsWithAttachments = fieldsWithAttachments;
		this._wrapFields(items);
	}
	getMetadata() {
		return this._fieldsWithAttachments;
	}
	getAttachments() {
		return this._attachments;
	}
	toObject() {}
	_wrapFields(items) {
		const fieldsWithAttachments = this._fieldsWithAttachments || {};
		for (let item of items) {
			for (let field of Object.keys(fieldsWithAttachments)) {
				this._wrapSingleField(item, field);
			}
		}
	}
	_wrapSingleField(item, field) {
		const fieldsWithAttachments = this._fieldsWithAttachments[field];
		item[field] = Array.isArray(item[field])
			? item[field].map(id =>
					ReferenceField.make(
						this._attachments,
						fieldsWithAttachments,
						id,
						field
					)
			  )
			: ReferenceField.make(
					this._attachments,
					fieldsWithAttachments,
					item[field],
					field
			  );
	}
};
