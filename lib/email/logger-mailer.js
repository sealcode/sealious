class LoggerMailer {
	constructor(app) {
		this.logger = app.Logger;
	}
	verify() {
		return "ok";
	}
	sendEmail({ to, subject, text, html }) {
		this.logger.info({
			message: "Would send an email here",
			to,
			subject,
			text,
		});
	}
}

module.exports = LoggerMailer;
