const SealiousResponse = require("./sealious-response.js");

module.exports = class SingleItemResponse extends SealiousResponse {
	constructor({ item, attachments = {}, fieldsWithAttachments = {} }) {
		super({ items: [item], attachments, fieldsWithAttachments });
		this._empty = true;
		for (let key of Object.keys(item)) {
			this._empty = false;
			this[key] = item[key];
		}
	}
	toObject() {
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
};
