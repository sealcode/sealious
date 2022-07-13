import Mailer from "./mailer";
import type { MessageData } from "./message";

export default class LoggerMailer extends Mailer {
	async verify() {
		return true;
	}
	async sendEmail({ to, subject, text }: MessageData) {
		this.app.Logger.info("✉ MAIL", "Would send an email here", {
			to,
			subject,
			text,
		});
	}
}
