import type { App } from "../main.js";
import type { MessageData } from "./message.js";

export default abstract class Mailer {
	app: App;
	abstract verify(): Promise<boolean>;
	abstract sendEmail(
		message: MessageData & { from_name: string }
	): Promise<void>;
	async send(message_data: MessageData): Promise<void> {
		return this.sendEmail({
			...message_data,
			from_name: this.app.ConfigManager.get("email").from_name,
		});
	}
	async init(app: App): Promise<void> {
		this.app = app;
	}
}
