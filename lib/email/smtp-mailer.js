const assert = require("assert");
const nodemailer = require("nodemailer");

class SmtpMailer {
	constructor(app) {
		const config = app.ConfigManager.get("smtp");
		assert(typeof config.host == "string");
		assert(typeof config.port == "number");
		assert(typeof config.user == "string");
		assert(typeof config.password == "string");
		this.config = config;
		this.transport = nodemailer.createTransport({
			host: config.smtp.host,
			port: config.smtp.port,
			auth: {
				user: config.smtp.user,
				pass: config.smtp.pass,
			},
		});
	}
	async verify() {
		return this.transport.verify();
	}
	async sendEmail({ to, subject, text, html, from_name }) {
		return this.transport.sendMail({
			from: `${from_name || this.config.from_name} <${
				this.config.from_address
			}>`,
			to,
			subject,
			text,
			html,
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
