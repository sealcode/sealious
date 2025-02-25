import Mailer from "./mailer.js";
import type { MessageData } from "./message.js";

export default class LoggerMailer extends Mailer {
	async verify(): Promise<true> {
		return true;
	}
	async sendEmail({ to, subject, text }: MessageData): Promise<void> {
		this.app.Logger.info("✉ MAIL", "Would send an email here", {
			to,
			subject,
			text,
		});
	}
}
