import { App } from "../main";
import Mailer, { emailMessage } from "./mailer";
import winston from "winston";

export default class LoggerMailer extends Mailer {
	logger: winston.Logger;
	constructor(app: App) {
		super(app);
		this.logger = app.Logger;
	}
	async verify() {
		return true;
	}
	async sendEmail({ to, subject, text }: emailMessage) {
		this.logger.info({
			message: "Would send an email here",
			to,
			subject,
			text,
		});
	}
}
