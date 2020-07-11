import SealiousResponse from "./sealious-response.js";
import Item from "./item";

export default class SingleItemResponse extends SealiousResponse {
	_empty: boolean;
	[field_name: string]: any;
	constructor({
		item,
		attachments = {},
		fieldsWithAttachments = {},
	}: {
		item: Item;
		attachments: {
			[id: string]: Item;
		};
		fieldsWithAttachments: { [field_name: string]: {} };
	}) {
		super({ items: [item], attachments, fieldsWithAttachments });
		this._empty = true;
		for (let key of Object.keys(item)) {
			this._empty = false;
			this[key] = item[key];
		}
	}
	toObject(): object {
		const { _attachments, _empty, _fieldsWithAttachments, ...item } = this;
		return {
			item,
			attachments: _attachments,
			fieldsWithAttachments: _fieldsWithAttachments,
		};
	}
	get empty() {
		return this._empty;
	}
}
