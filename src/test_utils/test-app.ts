// @ts-ignore
const locreq = require("locreq")(__dirname);
import { App, SMTPMailer } from "../main";
import { Environment } from "../app/config";
import { LoggerLevel } from "../app/logger";

export const get_test_app = ({
	env,
	port,
	base_url,
}: {
	env: Environment;
	port: number;
	base_url: string;
}) => {
	return class TestApp extends App {
		clear_database_on_stop: boolean = true;
		collections = { ...App.BaseCollections };
		config = {
			upload_path: "/tmp",
			datastore_mongo: {
				host: process.env.SEALIOUS_DB_HOST || "localhost",
				password: "sealious-test",
				port: parseInt(process.env.SEALIOUS_DB_HOST || "20722"),
			},
			email: {
				from_name: "Sealious test app",
				from_address: "sealious@example.com",
			},
			core: { environment: env },
			app: { version: "0.0.0-test" },
			logger: { level: "none" as LoggerLevel },
			"www-server": {
				port,
			},
			password_hash: {
				iterations: 1,
			},
		};
		manifest = {
			name: "testing app",
			logo: locreq.resolve("src/assets/logo.png"),
			default_language: "pl",
			version: "0.0.0-test",
			base_url,
			colors: {
				primary: "#4d394b",
			},
			admin_email: "admin@example.com",
		};
		mailer = new SMTPMailer({
			host: process.env.SEALIOUS_SMTP_HOST || "localhost",
			port: parseInt(process.env.SEALIOUS_SMTP_PORT || "1025"),
			user: "any",
			password: "any",
		});

		async start() {
			this.on("stopping", async () => {
				if (this.clear_database_on_stop && this.Datastore.db) {
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
	};
};

export type TestAppType = ReturnType<typeof get_test_app>;
