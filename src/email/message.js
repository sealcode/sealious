const assert = require("assert");

module.exports = class Message {
	constructor({ to, subject, html, attachments, text }) {
		assert(to);
		assert(subject);
		assert(html);
		assert(attachments === undefined || Array.isArray(attachments));
		Object.assign(this, { to, subject, html, attachments, text });
	}
	async send(app) {
		return app.Mail.send(this);
	}
};
