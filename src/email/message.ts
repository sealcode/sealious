import assert from "assert";
import App from "../app/app";

export type MessageData = {
	to: string;
	subject: string;
	html: string;
	attachments: any[];
	text: string;
};

export default class Message {
	data: MessageData;
	constructor(data: MessageData) {
		assert(data.to);
		assert(data.subject);
		assert(data.html);
		assert(
			data.attachments === undefined || Array.isArray(data.attachments)
		);
		this.data = data;
	}
	async send(app: App) {
		return app.Email.send(this.data);
	}
}
