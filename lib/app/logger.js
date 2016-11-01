"use strict";
const locreq = require("locreq")(__dirname);
const winston = require("winston");
const getDateTime = locreq("lib/utils/get-datetime.js");

/*
    This is the custom logger level and color configuration.

    @levels - default logger levels, 0 being the lowest importance, 4 being the highest:
       * lazyseal - an Easter, or should we say: Sealious egg. Used only for humorous reasons, the lowest level of importance, default color: white,
       * info - used for stating the current status or general information such as starting the server, default color: green,
       * debug - used for debugging, default color: blue,
       * warning - used to display warnings, default color: yellow,
       * error - used to display errors, default color: red

*/

const Logger = function(app){
	const transports_array = [];

	const logger_level = app.ConfigManager.get_config().logger.level;
	const logger_color = app.ConfigManager.get_config().logger.color;
	const logger_file = app.ConfigManager.get_config().logger.file;
	const logger_dirname = app.ConfigManager.get_config().logger.dirname;
	const logger_to_json = app.ConfigManager.get_config().logger.to_json;
	const logger_rotation = app.ConfigManager.get_config().logger.rotation;


	const winston_level = new(winston.transports.Console)({
		level: logger_level,
		colorize: logger_color,
		timestamp: function(){
			return getDateTime(false);
		},
	});
	transports_array.push(winston_level);


	if (logger_file){
		const winston_save_to_file = new(winston.transports.File)({
			filename: logger_file,
			colorize: logger_color,
			timestamp: function(){
				return getDateTime(true);
			},
			dirname: logger_dirname,
			json: logger_to_json,
		});
		const winston_daily_rotate = new(winston.transports.DailyRotateFile)({
			filename: logger_file,
			datePattern: logger_rotation,
		});
		transports_array.push(winston_save_to_file);
		transports_array.push(winston_daily_rotate);
	}

	const logger = new winston.Logger({
		levels: Logger.custom.levels,
		colors: Logger.custom.colors,
		transports: transports_array,
	});

	logger.rewriters.push(function(level, msg, meta){
		if (Object.keys(meta).length){
			let message = "\n";
			for (const prop in meta){
				message += ` - ${  prop  }: ${  JSON.stringify(meta[prop])  }\n`;
			}
			meta = message;
		}

		return meta;
	});

	return logger;
};

Logger.custom = {
	levels: {
		lazyseal: 0,
		info: 1,
		debug: 2,
		warning: 3,
		error: 4,
		no_output: 5,
	},
	colors: {
		lazyseal: "white",
		info: "green",
		debug: "blue",
		warning: "yellow",
		error: "red",
	},
};

module.exports = Logger;