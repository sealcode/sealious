const SealiousResponse = require("./sealious-response.js");

module.exports = class CollectionResponse extends SealiousResponse {
	constructor({ items, attachments = {}, fieldsWithAttachments = {} }) {
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
};
