/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import type { App } from "../app/app.js";
import asyncForEach from "../utils/async-foreach.js";

export type MailcatcherMessage = {
	recipients: string[];
	subject: string;
	id: number;
	sender: string;
};

export default class MailcatcherAPI {
	constructor(public smtp_api_url: string, private app: App) {}
	async getMessages() {
		const app_address = this.app.ConfigManager.get("email").from_address;
		const all_messages = (await (
			await fetch(`${this.smtp_api_url}/messages`)
		).json()) as MailcatcherMessage[];
		return all_messages.filter(
			(message) => message.sender == `<${app_address}>`
		);
	}
	async getMessageById(id: number) {
		return await (
			await fetch(`${this.smtp_api_url}/messages/${id}.html`)
		).text();
	}
	async deleteAllInstanceEmails() {
		const messages = await this.getMessages();
		await asyncForEach(messages, async (m) => {
			await fetch(`${this.smtp_api_url}/messages/${m.id}`, {
				method: "delete",
			});
		});
	}
}
