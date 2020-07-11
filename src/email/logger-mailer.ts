import Mailer from "./mailer";
import { MessageData } from "./message";

export default class LoggerMailer extends Mailer {
	async verify() {
		return true;
	}
	async sendEmail({ to, subject, text }: MessageData) {
		this.app.Logger.info({
			message: "Would send an email here",
			to,
			subject,
			text,
		});
	}
}
