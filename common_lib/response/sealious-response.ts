import { make } from "../sealious_response_fields/reference-field";
import Item from "./item";

export default class SealiousResponse {
	_attachments: { [id: string]: Item };
	_fieldsWithAttachments: { [field_name: string]: {} };
	items: Item[];
	constructor({
		items,
		attachments,
		fieldsWithAttachments,
	}: {
		items: Item[];
		attachments: { [id: string]: Item };
		fieldsWithAttachments: { [field_name: string]: {} };
	}) {
		this._attachments = attachments;
		this._fieldsWithAttachments = fieldsWithAttachments;
		this._wrapFields(items);
		this.items = items;
	}
	getMetadata() {
		return this._fieldsWithAttachments;
	}
	getAttachments() {
		return this._attachments;
	}
	toObject() {}
	_wrapFields(items: Item[]) {
		const fieldsWithAttachments = this._fieldsWithAttachments || {};
		for (let item of items) {
			for (let field of Object.keys(fieldsWithAttachments)) {
				this._wrapSingleField(item, field);
			}
		}
	}
	_wrapSingleField(item: Item, field: keyof Item) {
		const fieldsWithAttachments = this._fieldsWithAttachments[field];
		item[field] = Array.isArray(item[field])
			? (item[field] as string[]).map((id) =>
					make(
						this._attachments,
						fieldsWithAttachments,
						id,
						field as string
					)
			  )
			: make(
					this._attachments,
					fieldsWithAttachments,
					item[field],
					field as string
			  );
	}
}
