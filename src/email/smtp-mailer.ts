import assert from "assert";
import nodemailer from "nodemailer";
import { App } from "../main";
import Mailer from "./mailer";
import { MessageData } from "./message";

export default class SmtpMailer extends Mailer {
	mail_config: { from_name: string; from_address: string };
	transport: nodemailer.Transporter;
	constructor(config: {
		host: string;
		port: number;
		user: string;
		password: string;
	}) {
		super();
		assert(typeof config.host == "string");
		assert(typeof config.port == "number");
		assert(typeof config.user == "string");
		assert(typeof config.password == "string");
		this.transport = nodemailer.createTransport({
			host: config.host,
			port: config.port,
			auth: {
				user: config.user,
				pass: config.password,
			},
		});
	}

	async verify() {
		return this.transport.verify();
	}

	async init(app: App) {
		await super.init(app);
		this.mail_config = app.ConfigManager.get("email");
	}

	async sendEmail({
		to,
		subject,
		text,
		html,
		from_name,
		attachments,
	}: MessageData & { from_name: string }) {
		return this.transport.sendMail({
			from: `${from_name || this.mail_config.from_name} <${
				this.mail_config.from_address
			}>`,
			to,
			subject: subject.toString(),
			text,
			html,
			attachments,
		});
	}

	static default_config = {
		host: null,
		port: null,
		user: null,
		password: null,
	};
}
