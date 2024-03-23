/*
	The class has a dual nature, developer has a possibility to refer to it
	as if it was a string e.g.:

	console.log(item.reference_field) // 'SomeId'

	but (s)he also can use it as a container for item which is referenced e.g.:

	console.log(item.reference_field.name) // 'Some cool name'
*/

import Item from "../response/item.js";

export function make(
	attachments: { [id: string]: Item },
	fieldsWithAttachments: { [field_name: string]: {} },
	id: string | any,
	field_name: string
) {
	return new ReferenceField(
		{ attachments, fieldsWithAttachments, field_name },
		id.toString()
	);
}

export default class ReferenceField extends String {
	_value: string;
	[field: string]: any;
	constructor(
		attachments_params: {
			attachments: any;
			fieldsWithAttachments: any;
			field_name?: string;
		},
		id: string
	) {
		super(id);
		this._value = id;
		const body = this.extractAttachmentsForId(attachments_params);
		for (let field of Object.keys(body)) {
			this[field] = body[field];
		}
	}
	extractAttachmentsForId({
		attachments,
		fieldsWithAttachments,
	}: {
		attachments: { [id: string]: Item };
		fieldsWithAttachments: { [field_name: string]: {} };
	}) {
		const body = attachments[this._value];

		for (let name of Object.keys(fieldsWithAttachments)) {
			let id = body[name];
			body[name] = make(
				attachments,
				fieldsWithAttachments[name],
				id,
				name
			);
		}
		return body;
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
}
