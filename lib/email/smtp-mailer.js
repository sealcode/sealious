const assert = require("assert");
const nodemailer = require("nodemailer");

class SmtpMailer {
	constructor(app) {
		const config = app.ConfigManager.get("smtp");
		assert(typeof config.host == "string");
		assert(typeof config.port == "number");
		assert(typeof config.user == "string");
		assert(typeof config.password == "string");
		this.mail_config = app.ConfigManager.get("email");
		this.transport = nodemailer.createTransport({
			host: config.host,
			port: config.port,
			auth: {
				user: config.user,
				pass: config.password,
			},
		});
	}
	async verify() {
		return this.transport.verify();
	}
	async sendEmail({ to, subject, text, html, from_name, attachments }) {
		return this.transport.sendMail({
			from: `${from_name || this.config.from_name} <${
				this.mail_config.from_address
			}>`,
			to,
			subject: subject.toString(),
			text,
			html,
			attachments,
		});
	}
}

SmtpMailer.default_config = {
	host: null,
	port: null,
	user: null,
	password: null,
};

module.exports = SmtpMailer;
