import { App } from "../main";
import { MessageData } from "./message";

export default abstract class Mailer {
	app: App;
	constructor(app: App) {
		this.app = app;
	}
	abstract verify(): Promise<boolean>;
	abstract sendEmail(
		message: MessageData & { from_name: string }
	): Promise<void>;
	async send(message_data: MessageData) {
		return this.sendEmail({
			...message_data,
			from_name: this.app.ConfigManager.get("email").from_name,
		});
	}
	async init() {}
}
