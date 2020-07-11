import SealiousResponse from "./sealious-response.js";
import Item from "./item";

export default class CollectionResponse extends SealiousResponse {
	items: Item[];
	constructor({
		items,
		attachments = {},
		fieldsWithAttachments = {},
	}: {
		items: Item[];
		attachments: { [id: string]: Item };
		fieldsWithAttachments: { [field_name: string]: {} };
	}) {
		super({ items, attachments, fieldsWithAttachments });
		this.items = items;
	}
	toObject() {
		return {
			items: this.items,
			attachments: this._attachments,
			fieldsWithAttachments: this._fieldsWithAttachments,
		};
	}
	get length() {
		return this.items.length;
	}
	get empty() {
		return this.length === 0;
	}
}
