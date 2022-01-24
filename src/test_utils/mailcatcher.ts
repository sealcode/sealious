/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import axios from "axios";

import App from "../app/app";
import asyncForEach from "../utils/async-foreach";

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
		const all_messages = (await axios.get(`${this.smtp_api_url}/messages`))
			.data as MailcatcherMessage[];
		return all_messages.filter(
			(message) => message.sender == `<${app_address}>`
		);
	}
	async getMessageById(id: number) {
		return (await axios.get(`${this.smtp_api_url}/messages/${id}.html`))
			.data as string;
	}
	async deleteAllInstanceEmails() {
		const messages = await this.getMessages();
		await asyncForEach(messages, async (m) => {
			await axios.delete(`${this.smtp_api_url}/messages/${m.id}`);
		});
	}
}
