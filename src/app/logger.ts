import { App } from "../main";

import winston from "winston";

export default function (app: App) {
	const transports_array = [];

	const logger_level = app.ConfigManager.get("logger.level");
	const logger_file = app.ConfigManager.get("logger.file");
	const logger_dirname = app.ConfigManager.get("logger.dirname");

	const winston_level = new winston.transports.Console({
		level: logger_level,
	});
	transports_array.push(winston_level);

	if (logger_file) {
		const winston_save_to_file = new winston.transports.File({
			filename: logger_file,
			dirname: logger_dirname,
		});
		transports_array.push(winston_save_to_file);
	}

	const logger = winston.createLogger({
		transports: transports_array,
	});

	return logger;
}
