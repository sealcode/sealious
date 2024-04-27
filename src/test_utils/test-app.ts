/* eslint-disable */
import locreq_curry from "locreq";
const locreq = locreq_curry(module_dirname(import.meta.url));
import { App, SMTPMailer } from "../main.js";
import type { Environment } from "../app/config.js";
import type { LoggerLevel } from "../app/logger.js";
import LoggerMailer from "../email/logger-mailer.js";
import { module_dirname } from "../utils/module_filename.js";

export class TestApp extends App {
	clear_database_on_stop: boolean = true;
	collections = { ...App.BaseCollections };
	constructor(
		uniq_id: string,
		env: Environment,
		port: number,
		base_url: string,
		public config = {
			upload_path: "/tmp/sealious-uploads",
			datastore_mongo: {
				host: process.env.SEALIOUS_DB_HOST || "127.0.0.1",
				password: "sealious-test",
				port: parseInt(process.env.SEALIOUS_DB_PORT || "20722"),
				db_name: "sealious-test",
			},
			email: {
				from_name: "Sealious test app",
				from_address: `sealious-${uniq_id}@example.com`,
			},
			core: { environment: env },
			app: { version: "0.0.0-test" },
			logger: {
				level: (process.env.SEALIOUS_DEBUG || "none") as LoggerLevel,
				// level: "debug3" as LoggerLevel,
			},
			"www-server": {
				port,
			},
			password_hash: {
				iterations: 1,
			},
		},
		public manifest = {
			name: "testing app",
			logo: locreq.resolve("src/assets/logo.png"),
			default_language: "pl",
			version: "0.0.0-test",
			base_url,
			colors: {
				primary: "#4d394b",
			},
			admin_email: "admin@example.com",
		},
		public mailer = env == "production"
			? new SMTPMailer({
					host: process.env.SEALIOUS_SMTP_HOST || "127.0.0.1",
					port: parseInt(process.env.SEALIOUS_SMTP_PORT || "1825"),
					user: "any",
					password: "any",
			  })
			: new LoggerMailer()
	) {
		super();
	}

	async start() {
		this.on("stopping", async () => {
			if (this.clear_database_on_stop && this.Datastore.db) {
				this.Logger.info("TEST APP", "Clearing the database...");
				for (const collection_name in this.collections) {
					await this.Datastore.remove(
						collection_name,
						{},
						"just_one" && false
					);
				}
				await this.Datastore.remove(
					this.Metadata.db_collection_name,
					{},
					"just_one" && false
				);
			}
		});

		await super.start();
	}
}
