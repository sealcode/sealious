import { App } from "../main";

export type emailMessage = {
	to: string;
	subject: string;
	text: string;
	html: string;
	from_name: string;
	attachments: [];
};

export default abstract class Mailer {
	app: App;
	constructor(app: App) {
		this.app = app;
	}
	abstract verify(): Promise<boolean>;
	abstract sendEmail(message: emailMessage): Promise<void>;
	async send(message: emailMessage) {
		return this.sendEmail({
			to: message.to,
			subject: message.subject,
			text: message.text,
			html: message.html,
			attachments: message.attachments,
			from_name: this.app.ConfigManager.get("email.from_name"),
		});
	}
	async init() {}
}
