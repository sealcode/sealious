/*
	The class has a dual nature, developer has a possibility to refer to it
	as if it was a string e.g.:

	console.log(item.reference_field) // 'SomeId'

	but (s)he also can use it as a container for item which is referenced e.g.:

	console.log(item.reference_field.name) // 'Some cool name'
*/

module.exports = class ReferenceField extends String {
	constructor(attachments_params, id, extractor) {
		super(id);
		this._value = id;
		const body = this.extractAttachmentsForId(attachments_params);
		for (let field of Object.keys(body)) {
			this[field] = body[field];
		}
	}
	extractAttachmentsForId({ attachments, fieldsWithAttachments }) {
		const body = attachments[this._value];

		for (let name of Object.keys(fieldsWithAttachments)) {
			let id = body[name];
			body[name] = ReferenceField.make(
				attachments,
				fieldsWithAttachments[name],
				id,
				name
			);
		}
		return body;
	}
	static make(attachments, fieldsWithAttachments, ...params) {
		const [id, field_name] = params;
		return new ReferenceField(
			{ attachments, fieldsWithAttachments, field_name },
			id.toString()
		);
	}
	toString() {
		return this._value;
	}
	valueOf() {
		return this._value;
	}
	toJSON() {
		return this._value;
	}
};
