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

export default (smtp_api_url: string, app: App) => {
	const ret = {
		getMessages: async () => {
			const app_address = app.ConfigManager.get("email").from_address;
			const all_messages = (await axios.get(`${smtp_api_url}/messages`))
				.data as MailcatcherMessage[];
			return all_messages.filter(
				(message) => message.sender == `<${app_address}>`
			);
		},
		getMessageById: async (id: number) =>
			(await axios.get(`${smtp_api_url}/messages/${id}.html`))
				.data as string,
		deleteAllInstanceEmails: async () => {
			const messages = await ret.getMessages();
			await asyncForEach(messages, async (m) => {
				await axios.delete(`${smtp_api_url}/messages/${m.id}`);
			});
		},
	};
	return ret;
};
