import assert from "assert";
import SmtpMailer from "./smtp-mailer";
import LoggerMailer from "./logger-mailer";
import { App } from "../main";
import Mailer from "./mailer";
import { Environment } from "../app/config";

const environment_to_mailer: {
	[env in Environment]: new (app: App) => Mailer;
} = {
	dev: LoggerMailer,
	production: SmtpMailer,
};

export default (app: App) => {
	let environment: Environment;
	let config;
	let mailer;
	app.ConfigManager.setDefault("email", {
		from_name: "Noreply",
		from_address: "example@example.com",
	});
	app.ConfigManager.setDefault("smtp", SmtpMailer.default_config);
	config = app.ConfigManager.get("email");

	assert(typeof config.from_name === "string");
	assert(
		typeof config.from_address === "string",
		"Please set a config value for 'email.from_address'"
	);

	environment = app.ConfigManager.get("core").environment;
	mailer = new environment_to_mailer[environment as Environment](app);

	return mailer;
};
